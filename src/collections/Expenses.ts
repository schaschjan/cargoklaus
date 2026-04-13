import type { CollectionConfig, FieldHook } from 'payload'

const normalizeNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const roundCurrency = (value: number): number => Math.round(value * 100) / 100

const recalcTotals: FieldHook = async ({ context, data, originalDoc, req, siblingData, value }) => {
  if (context?.skipExpenseTotals) return value

  const docId = originalDoc?.id
  if (docId === undefined || docId === null) return value

  const priceNetInput = siblingData?.priceNet ?? data?.priceNet ?? originalDoc?.priceNet
  const taxRateInput = siblingData?.taxRate ?? data?.taxRate ?? originalDoc?.taxRate

  const priceNet = roundCurrency(normalizeNumber(priceNetInput))
  const taxRate = normalizeNumber(taxRateInput)
  const taxAmount = roundCurrency(priceNet * (taxRate / 100))
  const priceGross = roundCurrency(priceNet + taxAmount)

  const currentPriceNet = normalizeNumber(originalDoc?.priceNet)
  const currentTaxAmount = normalizeNumber(originalDoc?.taxAmount)
  const currentPriceGross = normalizeNumber(originalDoc?.priceGross)

  if (
    priceNet === currentPriceNet &&
    taxAmount === currentTaxAmount &&
    priceGross === currentPriceGross
  ) {
    return value
  }

  await req.payload.update({
    collection: 'expenses',
    id: docId,
    data: {
      priceNet,
      taxAmount,
      priceGross,
    },
    context: {
      ...context,
      skipExpenseTotals: true,
    },
    overrideAccess: false,
    req,
  })

  return value
}

export const Expenses: CollectionConfig = {
  slug: 'expenses',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'priceNet', 'taxRate', 'taxAmount', 'priceGross', 'createdAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'invoice',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: {
        mimeType: { equals: 'application/pdf' },
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: ['filament', 'shipping', 'hardware', 'other'],
    },
    {
      name: 'taxRate',
      type: 'number',
      required: true,
      admin: {
        description: 'Tax rate as a percentage (e.g. 20 for 20%).',
      },
      hooks: {
        afterChange: [recalcTotals],
      },
    },
    {
      name: 'priceNet',
      type: 'number',
      required: true,
      admin: {
        description: 'Net price before tax.',
      },
      hooks: {
        afterChange: [recalcTotals],
      },
    },
    {
      name: 'taxAmount',
      type: 'number',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'priceGross',
      type: 'number',
      required: true,
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
