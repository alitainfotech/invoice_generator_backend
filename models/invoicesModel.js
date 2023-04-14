module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    invoiceNumber: { type: String },
    client: { type: mongoose.Types.ObjectId, ref: "clients" },
    dueDate: { type: Date, default: new Date() },
    balanceDue: { type: Number, default: 0 },
    user: { type: mongoose.Types.ObjectId, ref: "users" },
    items: [
      {
        itemName: { type: String },
        unitPrice: { type: String },
        quantity: { type: String },
      },
    ],
    total: { type: Number },
    currency: { type: String },
    paymentDetails: {
      amountPaid: { type: Number },
      datePaid: { type: Date },
      paymentMethod: { type: String },
      paidBy: { type: mongoose.Types.ObjectId, ref: "clients" },
    },
    mediaId: { type: mongoose.Types.ObjectId, ref: "media" },
    notes: { type: String },
    createdAt: {
      type: Date,
      default: new Date(),
    },
  });

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Invoice = mongoose.model("invoices", schema);
  return Invoice;
};
