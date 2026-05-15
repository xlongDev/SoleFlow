export interface SupplierAftercare {
    refundAddress: string
    refundContact: string
    refundNotes: string
}

export const emptySupplierAftercare = (): SupplierAftercare => ({
    refundAddress: '',
    refundContact: '',
    refundNotes: ''
})
