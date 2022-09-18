const Photo = require("../models/photo.model");
const Voter = require("../models/voter.model");
const requestIp = require("request-ip");

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) {
      // if fields are not empty...

      const authorRegex = new RegExp(/^[a-zA-Z]{1,}(?: [a-zA-Z]+){0,2}$/, "g");
      const emailRegex = new RegExp(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "g"
      );
      const titleRegex = new RegExp(/^[a-zA-Z]{1,}(?: [a-zA-Z]+){0,2}$/, "g");

      if (!authorRegex.test(author)) {
        throw new Error("Invalid author");
      }
      if (!emailRegex.test(email)) {
        throw new Error("Invalid email");
      }
      if (!titleRegex.test(title)) {
        throw new Error("Invalid title");
      }

      const fileName = file.path.split("/").slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split(".").slice(-1)[0];

      validateInputs = function (ext, t, a) {
        allowedExt = ["jpg", "png", "gif"];
        if (
          allowedExt.findIndex((e) => e === ext) !== -1 &&
          t.length <= 25 &&
          a.length <= 50
        )
          return true;
      };

      if (validateInputs(fileExt, title, author)) {
        const newPhoto = new Photo({
          title,
          author,
          email,
          src: fileName,
          votes: 0,
        });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }
    } else {
      throw new Error("Wrong input!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const userIP = requestIp.getClientIp(req);
    const voter = await Voter.findOne({ user: userIP });
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if (voter) {
      if (voter.votes.includes(photoToUpdate._id)) {
        res.status(500).json(err);
      } else {
        photoToUpdate.votes++;
        await photoToUpdate.save();
        voter.votes.push(photoToUpdate._id);
        await voter.save();
        res.json(photoToUpdate);
      }
    } else {
      const newVoter = new Voter({ user: userIP, votes: [photoToUpdate._id] });
      await newVoter.save();
      photoToUpdate.votes++;
      await photoToUpdate.save();
      res.json(photoToUpdate);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
