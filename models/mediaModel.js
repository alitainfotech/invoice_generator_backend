module.exports = (mongoose) => {
  var schema = mongoose.Schema({
    file_path: { type: String },
    file_name: { type: String },
    access_path: { type: String },
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

  const Media = mongoose.model("media", schema);
  return Media;
};
