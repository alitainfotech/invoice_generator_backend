module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    name: { type: String, required: true },
    businessNo: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    mediaId: { type: mongoose.Types.ObjectId, ref: "media", required: true },
    userId: { type: mongoose.Types.ObjectId, ref: "users", required: true },
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

  const Client = mongoose.model("clients", schema);
  return Client;
};
