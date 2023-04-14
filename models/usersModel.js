module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetToken: { type: String },
    expireToken: { type: Date },
    phone: { type: String },
    address: { type: String },
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

  const User = mongoose.model("users", schema);
  return User;
};
