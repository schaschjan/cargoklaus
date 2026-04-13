import type { CollectionBeforeChangeHook, CollectionConfig, FieldHook } from 'payload'

import { adminOnly } from '@/access/adminOnly'

const formatSegment = (val: string): string =>
  val
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .toLowerCase()

const autoGenerateSegment: FieldHook = ({ data, value }) => {
  if (data?.generateSegment !== false && data?.title) {
    return formatSegment(data.title as string)
  }
  return value
}

const buildFullSlug: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!data.segment) return data

  const parentId = typeof data.parent === 'object' ? data.parent?.id : data.parent

  if (parentId) {
    const parent = await req.payload.findByID({
      collection: 'categories',
      id: parentId,
      depth: 0,
    })
    if (parent?.slug) {
      data.slug = `${parent.slug}/${data.segment}`
      return data
    }
  }

  data.slug = data.segment
  return data
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  hooks: {
    beforeChange: [buildFullSlug],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'segment',
      type: 'text',
      required: true,
      hooks: {
        beforeValidate: [autoGenerateSegment],
      },
      admin: {
        description: 'URL slug segment for this category (without parent prefix)',
      },
    },
    {
      name: 'generateSegment',
      type: 'checkbox',
      defaultValue: true,
      label: 'Auto-generate from title',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Full path slug (auto-computed: parent/segment)',
        position: 'sidebar',
      },
    },
  ],
}
