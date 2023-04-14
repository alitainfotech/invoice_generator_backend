const db = require("../models");
const ObjectId = db.mongoose.Types.ObjectId;
const Client = db.clients;
const Media = db.medias;


exports.getClient = async (req, res) => {
    const { id } = req.params;

    try {
        const client = await Client.findById(id);

        res.status(200).json(client);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

exports.getClients = async (req, res) => {
    const { page } = req.query;

    try {
        const LIMIT = 8;
        const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of every page

        const total = await Client.countDocuments({});
        const clients = await Client.find().sort({ _id: -1 }).limit(LIMIT).skip(startIndex);

        res.json({ data: clients, currentPage: Number(page), numberOfPages: Math.ceil(total / LIMIT) });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

exports.createClient = async (req, res) => {
    try {
        // console.log(req.body.user);
        let clientDetails = await Client.find({ email: req.body.email });
        clientDetails = JSON.parse(JSON.stringify(clientDetails));
        if (clientDetails.length) {
            if (clientDetails.some((e) => e.userId == req.body.user)) {
                res.json({ statusCode: 400, message: "User already exists!" })
            }
        }

        let file_path = file_name = access_path = "";
        if (req.files && req.files.length) {
            const files = req.files;
            if (files.length) {
                let hostUrl = req.protocol + "://" + req.headers.host;
                file_path = files[0].path;
                file_name = files[0].originalname;
                access_path = hostUrl + "/" + "logo" + "/" + files[0].filename;

                // let mediaDetails = await Media.findOne({ file_name: file_name });
                // if (mediaDetails) {
                //     req.body.mediaId = mediaDetails._id
                // } else {
                const newMedia = new Media({ file_path, file_name, access_path })
                await newMedia.save();
                req.body.mediaId = newMedia._id;
                // }
                delete req.body.files;
            }

            req.body.userId = req.body.user;
            req.body = { ...req.body, createdAt: new Date().toISOString() }
            const newClient = new Client(req.body)
            await newClient.save()
            res.status(200).json({ statusCode: 200, message: "Client added successfully!" })
        } else {
            res.json({ statusCode: 400, message: "Please select file" })
        }

    } catch (error) {
        res.json({ statusCode: 400, message: error.message })
    }
}

exports.updateClient = async (req, res) => {
    const { id: _id } = req.params
    const client = req.body

    if (!ObjectId.isValid(_id)) return res.status(404).send('No client with that id')

    const updatedClient = await Client.findByIdAndUpdate(_id, { ...client, _id }, { new: true })

    res.json(updatedClient)
}

exports.deleteClient = async (req, res) => {
    const { id } = req.params

    if (!ObjectId.isValid(id)) return res.status(404).send('No Client with that id')

    await Client.findByIdAndRemove(id)

    res.json({ message: 'Client deleted successfully' })
}

exports.getClientsByUser = async (req, res) => {
    const { searchQuery } = req.query;

    try {
        const clients = await Client.find({ userId: searchQuery });

        res.json({ data: clients });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}