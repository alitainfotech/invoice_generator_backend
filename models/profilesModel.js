module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    name: String,
    email: { type: String, required: true, unique: true },
    phoneNumber: String,
    businessName: String,
    contactAddress: String,
    logo: String,
    website: String,
    userId: [String],
  });

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Profile = mongoose.model("profiles", schema);
  return Profile;
};
