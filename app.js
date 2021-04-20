require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const formidable = require("formidable");
const versionData = require("./version");

const app = express();

const version = versionData.getVersionData;

const TWO_DAYS = 1000 * 60 * 60 * 48;

const {
  PORT = process.env.PORT || 3000,
    SALT_ROUNDS = 13,
    SESS_NAME = "sid",
    NODE_ENV = "development",
    SESS_LIFETIME = TWO_DAYS,
    SESS_SECRET = "shshshshshshsh, this is a secret to online survey project."
} = process.env;

const IN_PROD = NODE_ENV === "production";

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  name: SESS_NAME,
  resave: false,
  saveUninitialized: false,
  secret: SESS_SECRET,
  cookie: {
    maxAge: SESS_LIFETIME,
    sameSite: true, //same as strict
    secure: IN_PROD
  }
}));

mongoose.set('useFindAndModify', false);

mongoose.connect("mongodb://localhost:27017/surveyDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const questionSchema = new mongoose.Schema({
  text: String,
  image: String,
  type: String,
  isRequired: {
    type: Boolean,
    default: false
  },
  checkBoxes: [String],
  radioButtons: [String],
  textAnswer: String
});

const answerSchema = new mongoose.Schema({
  radioButton: String,
  checkBoxes: [String],
  textAnswer: String
});

const respondentSchema = new mongoose.Schema({
  answer: [answerSchema]
});

const surveySchema = new mongoose.Schema({
  title: String,
  description: String,
  questions: [questionSchema],
  respondents: [respondentSchema],
  isActive: {
    type: Boolean,
    default: false
  }
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  surveys: [surveySchema],
  name: String,
  isActivated: {
    type: Boolean,
    default: false
  }
});

const User = mongoose.model("User", userSchema);
const Survey = mongoose.model("Survey", surveySchema);
const Question = mongoose.model("Question", questionSchema);
const Respondent = mongoose.model("Respondent", respondentSchema);
const Answer = mongoose.model("Answer", answerSchema);

let mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS
  }
});


// root route
app.get("/", (req, res) => {

  if (req.session.userId) {
    const userId = req.session.userId;

    User.findById(userId, (err, foundUser) => {
      if (!err && foundUser) {
        return res.redirect("/en/" + userId + "/surveys");
      }
    });
  } else {
    return res.redirect("/en");
  }

});

app.get("/:version", (req, res) => {

  const versionPage = req.params.version;

  if (req.session.userId) {
    const userId = req.session.userId;

    User.findById(userId, (err, foundUser) => {
      if (!err && foundUser) {

        if (versionPage === "de") {
          return res.render("surveys", {
            version: version.de.surveys,
            lang: version.de.lang,
            user: foundUser
          });
        } else {
          return res.render("surveys", {
            version: version.en.surveys,
            lang: version.en.lang,
            user: foundUser
          });
        }

      }
    });
  } else {
    if (versionPage === "de") {
      return res.render("root", {
        version: version.de.root,
        lang: version.de.lang,
        message: ""
      });
    } else {
      return res.render("root", {
        version: version.en.root,
        lang: version.en.lang,
        message: ""
      });
    }
  }

});


// ----------------------- edit route ----------------------------------------
app.get("/:version/edit/:userid/:surveyid", (req, res) => {

  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;

  let pageLang;
  let lang;
  let message;
  let activatemsg;
  if (versionPage === "de") {
    pageLang = version.de.root;
    lang = version.de.lang;
    message = "Bitte loggen Sie sich zuerst ein.";
    activatemsg = "Bitte aktivieren Sie zuerst Ihr Konto";
  } else {
    pageLang = version.en.root;
    lang = version.en.lang;
    message = "Please login first";
    activatemsg = "Please activate your account first.";
  }

  if (!req.session.userId) {
    return res.render("root", {
      version: pageLang,
      lang: lang,
      message: message
    });
  }

  User.findById(userId, (err, foundUser) => {
    if (foundUser.isActivated === false) {
      return res.render("root", {
        version: pageLang,
        lang: lang,
        message: activatemsg
      });
    } else {

      foundUser.surveys.forEach(survey => {
        if (survey.id === surveyId) {

          if (versionPage === "de") {
            return res.render("edit", {
              version: version.de.edit,
              lang: version.de.lang,
              user: foundUser,
              survey: survey,
              questions: survey.questions,
              msg: "",
              logoutmsg: ""
            });
          } else {
            return res.render("edit", {
              version: version.en.edit,
              lang: version.en.lang,
              user: foundUser,
              survey: survey,
              questions: survey.questions,
              msg: "",
              logoutmsg: ""
            });
          }

        }
      });
    }
  });
});

//open from home
app.post("/:version/edit/:userid/:surveyid", (req, res) => {

  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;

  let pageLang;
  let lang;
  let message;
  let activatemsg;
  if (versionPage === "de") {
    pageLang = version.de.root;
    lang = version.de.lang;
    message = "Bitte loggen Sie sich zuerst ein.";
    activatemsg = "Bitte aktivieren Sie zuerst Ihr Konto";
  } else {
    pageLang = version.en.root;
    lang = version.en.lang;
    message = "Please login first";
    activatemsg = "Please activate your account first.";
  }

  if (!req.session.userId) {
    return res.render("root", {
      version: pageLang,
      lang: lang,
      message: message
    });
  }

  User.findById(userId, (err, foundUser) => {
    if (foundUser.isActivated === false) {
      return res.render("root", {
        version: pageLang,
        lang: lang,
        message: activatemsg
      });
    } else {

      foundUser.surveys.forEach(survey => {
        if (survey.id === surveyId) {

          if (versionPage === "de") {
            return res.render("edit", {
              version: version.de.edit,
              lang: version.de.lang,
              user: foundUser,
              survey: survey,
              questions: survey.questions,
              msg: "",
              logoutmsg: ""
            });
          } else {
            return res.render("edit", {
              version: version.en.edit,
              lang: version.en.lang,
              user: foundUser,
              survey: survey,
              questions: survey.questions,
              msg: "",
              logoutmsg: ""
            });
          }

        }
      });
    }
  });
});

// open another survey
app.post("/:version/edit/:userid/:surveyid/", (req, res) => {
  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;

  return res.redirect("/" + versionPage + "/edit/" + userId + "/" + surveyId);
});

// click home
app.post("/:version/edit/:userid/:surveyid/tohome", (req, res) => {
  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;

  let msg;
  if (versionPage === "de") {
    msg = "Haben Sie Ihre Arbeit gespreichert?";
  } else {
    msg = "Did you already save your work?";
  }

  User.findById(userId, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {

      foundUser.surveys.forEach(survey => {
        if (survey.id === surveyId) {

          if (versionPage === "de") {
            return res.render("edit", {
              version: version.de.edit,
              lang: version.de.lang,
              user: foundUser,
              survey: survey,
              questions: survey.questions,
              msg: msg,
              logoutmsg: ""
            });
          } else {
            return res.render("edit", {
              version: version.en.edit,
              lang: version.en.lang,
              user: foundUser,
              survey: survey,
              questions: survey.questions,
              msg: msg,
              logoutmsg: ""
            });
          }

        }
      });
    }
  });
});

// click logout
app.post("/:version/edit/:userid/:surveyid/logout", (req, res) => {
  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;

  let msg;
  if (versionPage === "de") {
    msg = "Haben Sie Ihre Arbeit gespreichert?";
  } else {
    msg = "Did you already save your work?";
  }

  User.findById(userId, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {

      foundUser.surveys.forEach(survey => {
        if (survey.id === surveyId) {

          if (versionPage === "de") {
            return res.render("edit", {
              version: version.de.edit,
              lang: version.de.lang,
              user: foundUser,
              survey: survey,
              questions: survey.questions,
              msg: "",
              logoutmsg: msg
            });
          } else {
            return res.render("edit", {
              version: version.en.edit,
              lang: version.en.lang,
              user: foundUser,
              survey: survey,
              questions: survey.questions,
              msg: "",
              logoutmsg: msg
            });
          }

        }
      });
    }
  });
});

// new survey
app.post("/:version/edit/:userid/:surveyid/newsurvey", (req, res) => {
  const userId = req.params.userid;
  const versionPage = req.params.version;

  const newSurvey = new Survey({
    title: "Edit your title.."
  });
  User.findById(userId, (err, foundUser) => {
    if (err || !foundUser) {
      console.log(err);
    } else {
      foundUser.surveys.push(newSurvey);
      foundUser.save(err => {
        if (err) {
          console.log(err);
        } else {
          return res.redirect("/" + versionPage + "/edit/" + userId + "/" + newSurvey.id);
        }
      })
    }
  });
});

// delete survey
app.post("/:version/edit/:userid/:surveyid/deletesurvey", (req, res) => {
  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;

  User.findById(userId, (err, foundUser) => {
    if (err || !foundUser) {
      console.log(err);
    } else {

      for (let i = 0; i < foundUser.surveys.length; i++) {

        const survey = foundUser.surveys[i];

        if (survey.id === surveyId) {

          foundUser.surveys.splice(i, 1);

          foundUser.save((err) => {
            if (err) {
              console.log(err);
            } else {
              if (versionPage === "de") {
                return res.render("surveys", {
                  version: version.de.surveys,
                  lang: version.de.lang,
                  user: foundUser
                });
              } else {
                return res.render("surveys", {
                  version: version.en.surveys,
                  lang: version.en.lang,
                  user: foundUser
                });
              }
            }
          });
        }
      }
    }
  });
});


// save survey
app.post("/:version/edit/:userid/:surveyid/save", (req, res) => {
  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;

  const title = req.body.title;
  const description = req.body.description;

  User.findById(userId, (err, foundUser) => {
    if (err || !foundUser) {
      console.log(err);
    } else {

      foundUser.surveys.forEach(survey => {
        if (survey.id === surveyId) {
          survey.title = title;
          survey.description = description;

          survey.questions.splice(0, survey.questions.length);

          if (req.body.questionnumber) {
            const numberOfQuestions = req.body.questionnumber;

            for (let i = 0; i < numberOfQuestions.length; i++) {

              const newQuestion = new Question();

              if (req.body["required" + i]) {
                newQuestion.isRequired = true;
              }

              if (numberOfQuestions.length > 1) {

                if (req.body.image) {
                  if (Array.isArray(req.body.image)) {
                    newQuestion.image = req.body.image[i];
                  } else {
                    newQuestion.image = req.body.image;
                  }

                } else {
                  newQuestion.image = "";
                }

                newQuestion.text = req.body.questiontext[i];
                const answerType = req.body.answertype[i];

                newQuestion.type = answerType;

                if (answerType === "radiobutton" && req.body["radiobtntext" + i]) {
                  const radioBtns = req.body["radiobtntext" + i];
                  if (Array.isArray(radioBtns)) {
                    for (let index = 0; index < radioBtns.length; index++) {

                      newQuestion.radioButtons.push(radioBtns[index]);

                    }
                  } else {

                    newQuestion.radioButtons.push(radioBtns);
                  }
                } else if (answerType === "checkbox" && req.body["checkboxtext" + i]) {
                  const checkBoxes = req.body["checkboxtext" + i];
                  if (Array.isArray(checkBoxes)) {
                    for (let index = 0; index < checkBoxes.length; index++) {
                      newQuestion.checkBoxes.push(checkBoxes[index]);
                    }
                  } else {
                    newQuestion.checkBoxes.push(checkBoxes);
                  }
                }
              } else {

                if (req.body["image" + i]) {
                  newQuestion.image = req.body["image" + i];
                } else {
                  newQuestion.image = "";
                }

                newQuestion.text = req.body.questiontext;
                const answerType = req.body.answertype;

                newQuestion.type = answerType;

                if (answerType === "radiobutton" && req.body['radiobtntext' + 0]) {
                  const radioBtns = req.body['radiobtntext' + 0];
                  if (Array.isArray(radioBtns)) {
                    for (let index = 0; index < radioBtns.length; index++) {
                      newQuestion.radioButtons.push(radioBtns[index]);
                    }
                  } else {
                    newQuestion.radioButtons.push(radioBtns);
                  }
                } else if (answerType === "checkbox" && req.body["checkboxtext" + 0]) {
                  const checkBoxes = req.body["checkboxtext" + 0];
                  if (Array.isArray(checkBoxes)) {
                    for (let index = 0; index < checkBoxes.length; index++) {
                      newQuestion.checkBoxes.push(checkBoxes[index]);
                    }
                  } else {
                    newQuestion.checkBoxes.push(checkBoxes);
                  }
                }
              }

              survey.questions.push(newQuestion);
            }
          }



          foundUser.save(err => {
            if (err) {
              console.log(err);

            } else {

              if (versionPage === "de") {
                return res.render("edit", {
                  version: version.de.edit,
                  lang: version.de.lang,
                  user: foundUser,
                  survey: survey,
                  questions: survey.questions,
                  msg: "",
                  logoutmsg: ""
                });
              } else {
                return res.render("edit", {
                  version: version.en.edit,
                  lang: version.en.lang,
                  user: foundUser,
                  survey: survey,
                  questions: survey.questions,
                  msg: "",
                  logoutmsg: ""
                });
              }
            }
          });
        }

      });


    }
  });
});

// upload image
app.post("/:version/edit/:userid/:surveyid/upload", (req, res) => {
  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;



  User.findById(userId, (err, foundUser) => {
    if (err || !foundUser) {
      console.log(err);
    } else {

      const form = new formidable({
        multiples: false,
        uploadDir: __dirname + "/public/images/"
      });

      for (let i = 0; i < foundUser.surveys.length; i++) {

        const survey = foundUser.surveys[i];

        if (survey.id === surveyId) {

          form.parse(req, (err, fields, files) => {
            if (err) {
              console.log(err);
            } else {

              for (var z = 0; z < survey.questions.length; z++) {

                if (fields.number == z) {
                  survey.questions[z].image = userId + surveyId + files.file.name;

                  foundUser.save(err => {
                    if (err) {
                      console.log(err);
                    } else {
                      if (versionPage === "de") {
                        return res.render("edit", {
                          version: version.de.edit,
                          lang: version.de.lang,
                          user: foundUser,
                          survey: survey,
                          questions: survey.questions,
                          msg: "",
                          logoutmsg: ""
                        });
                      } else {
                        return res.render("edit", {
                          version: version.en.edit,
                          lang: version.en.lang,
                          user: foundUser,
                          survey: survey,
                          questions: survey.questions,
                          msg: "",
                          logoutmsg: ""
                        });
                      }
                    }
                  });
                }
              }
            }
          });
          form.on('fileBegin', function(name, file) {
            file.path = form.uploadDir + userId + surveyId + file.name;
          });
        }
      }
    }
  });
});

// saveupload post route
// app.post("/:version/edit/:userid/:surveyid/saveupload", (req, res) => {
//   const userId = req.params.userid;
//   const surveyId = req.params.surveyid;
//   const versionPage = req.params.version;
//
//   User.findById(userId, (err, foundUser) => {
//     if (err || !foundUser) {
//       console.log(err);
//     } else {
//
//       const form = new formidable({
//         multiples: false,
//         uploadDir: __dirname + "/public/images/"
//       });
//
//       for (let i = 0; i < foundUser.surveys.length; i++) {
//
//         const survey = foundUser.surveys[i];
//
//         if (survey.id === surveyId) {
//
//           form.parse(req, (err, fields, files) => {
//             if (err) {
//               console.log(err);
//             } else {
//
//               survey.title = fields.title;
//               survey.description = fields.description;
//
//               survey.questions.splice(0, survey.questions.length);
//
//               if (fields.questionnumber) {
//                 const numberOfQuestions = fields.questionnumber;
//                 console.log(numberOfQuestions);
//
//                 for (var z = 0; z < numberOfQuestions.length; z++) {
//
//                   const newQuestion = new Question();
//
//                   if (numberOfQuestions.length > 1) {
//
//                     console.log(z);
//
//                     if (fields.image) {
//                       if (fields.image.length > 1) {
//                         newQuestion.image = fields.image[z];
//                       } else {
//                         newQuestion.image = fields.image;
//                       }
//                     } else {
//                       newQuestion.image = userId + surveyId + files.file.name;
//                     }
//
//                     newQuestion.text = fields.questiontext[z];
//                     const answerType = fields.answertype[z];
//
//                     newQuestion.type = answerType;
//
//                     if (answerType === "radiobutton" && fields["radiobtntext" + z]) {
//                       const radioBtns = fields["radiobtntext" + z];
//                       if (Array.isArray(radioBtns)) {
//                         for (let index = 0; index < radioBtns.length; index++) {
//
//                           newQuestion.radioButtons.push(radioBtns[index]);
//
//                         }
//                       } else {
//
//                         newQuestion.radioButtons.push(radioBtns);
//                       }
//                     } else if (answerType === "checkbox" && fields["checkboxtext" + z]) {
//                       const checkBoxes = fields["checkboxtext" + z];
//                       if (Array.isArray(checkBoxes)) {
//                         for (let index = 0; index < checkBoxes.length; index++) {
//                           newQuestion.checkBoxes.push(checkBoxes[index]);
//                         }
//                       } else {
//                         newQuestion.checkBoxes.push(checkBoxes);
//                       }
//                     }
//                   } else {
//
//                     if (files.file) {
//                       newQuestion.image = files.file.name;
//                     } else {
//                       newQuestion.image = fields.image[z];
//                     }
//
//                     newQuestion.text = fields.questiontext;
//                     const answerType = fields.answertype;
//
//                     newQuestion.type = answerType;
//
//                     if (answerType === "radiobutton" && fields['radiobtntext' + 0]) {
//                       const radioBtns = fields['radiobtntext' + 0];
//                       if (Array.isArray(radioBtns)) {
//                         for (let index = 0; index < radioBtns.length; index++) {
//                           newQuestion.radioButtons.push(radioBtns[index]);
//                         }
//                       } else {
//                         newQuestion.radioButtons.push(radioBtns);
//                       }
//                     } else if (answerType === "checkbox" && fields["checkboxtext" + 0]) {
//                       const checkBoxes = fields["checkboxtext" + 0];
//                       if (Array.isArray(checkBoxes)) {
//                         for (let index = 0; index < checkBoxes.length; index++) {
//                           newQuestion.checkBoxes.push(checkBoxes[index]);
//                         }
//                       } else {
//                         newQuestion.checkBoxes.push(checkBoxes);
//                       }
//                     }
//                   }
//
//                   survey.questions.push(newQuestion);
//                 }
//               }
//
//               foundUser.save(err => {
//                 if (err) {
//                   console.log(err);
//
//                 } else {
//
//                   if (versionPage === "de") {
//                     return res.render("edit", {
//                       version: version.de.edit,
//                       lang: version.de.lang,
//                       user: foundUser,
//                       survey: survey,
//                       questions: survey.questions,
//                       msg: "",
//                       logoutmsg: ""
//                     });
//                   } else {
//                     return res.render("edit", {
//                       version: version.en.edit,
//                       lang: version.en.lang,
//                       user: foundUser,
//                       survey: survey,
//                       questions: survey.questions,
//                       msg: "",
//                       logoutmsg: ""
//                     });
//                   }
//                 }
//               });
//
//
//             }
//           });
//         }
//
//
//       }
//
//       form.on('fileBegin', function(name, file) {
//         const fileType = file.type.split('/').pop();
//         if (fileType == "jpg" || fileType == "jpeg" || fileType == "png") {
//
//           file.path = form.uploadDir + userId + surveyId + file.name;
//
//         }
//
//       });
//     }
//
//
//   });
// });

// ----------------------- end edit route --------------------------------------

// ----------------------- start surveys route ---------------------------------
// surveys route
app.route("/:version/:userid/surveys")
  .get((req, res) => {
    const userId = req.params.userid;
    const versionPage = req.params.version;

    let pageLang;
    let lang;
    let message;
    let activatemsg;
    if (versionPage === "de") {
      pageLang = version.de.root;
      lang = version.de.lang;
      message = "Bitte loggen Sie sich zuerst ein.";
      activatemsg = "Bitte aktivieren Sie zuerst Ihr Konto";
    } else {
      pageLang = version.en.root;
      lang = version.en.lang;
      message = "Please login first";
      activatemsg = "Please activate your account first.";
    }

    if (!req.session.userId) {
      return res.render("root", {
        version: pageLang,
        lang: lang,
        message: message
      });
    }

    User.findById(userId, (err, foundUser) => {
      if (foundUser.isActivated === false) {
        return res.render("root", {
          version: pageLang,
          lang: lang,
          message: activatemsg
        });
      } else {
        if (versionPage === "de") {
          return res.render("surveys", {
            version: version.de.surveys,
            lang: version.de.lang,
            user: foundUser
          });
        } else {
          return res.render("surveys", {
            version: version.en.surveys,
            lang: version.en.lang,
            user: foundUser
          });
        }
      }
    });
  })
  .post((req, res) => {
    const userId = req.params.userid;
    const versionPage = req.params.version;

    User.findById(userId, (err, foundUser) => {
      if (err || !foundUser) {
        console.log(err);
      } else {
        if (versionPage === "de") {
          return res.render("surveys", {
            version: version.de.surveys,
            lang: version.de.lang,
            user: foundUser
          });
        } else {
          return res.render("surveys", {
            version: version.en.surveys,
            lang: version.en.lang,
            user: foundUser
          });
        }
      }
    });
  });

app.post("/:version/:userid/surveys/addsurvey", (req, res) => {
  const userId = req.params.userid;
  const versionPage = req.params.version;

  const newSurvey = new Survey({
    title: "Edit your title.."
  });
  User.findById(userId, (err, foundUser) => {
    if (err || !foundUser) {
      console.log(err);
    } else {
      foundUser.surveys.push(newSurvey);
      foundUser.save(err => {
        if (err) {
          console.log(err);
        } else {
          return res.redirect("/" + versionPage + "/edit/" + userId + "/" + newSurvey.id);
        }
      })
    }
  });
});

// ------------------------- end surveys route ---------------------------------

// ------------------------- result route --------------------------------------

app.get("/:version/result/:userid/:surveyid", (req, res) => {
  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;

  let pageLang;
  let lang;
  let message;
  let activatemsg;
  if (versionPage === "de") {
    pageLang = version.de.root;
    lang = version.de.lang;
    message = "Bitte loggen Sie sich zuerst ein.";
    activatemsg = "Bitte aktivieren Sie zuerst Ihr Konto";
  } else {
    pageLang = version.en.root;
    lang = version.en.lang;
    message = "Please login first";
    activatemsg = "Please activate your account first.";
  }

  if (!req.session.userId) {
    return res.render("root", {
      version: pageLang,
      lang: lang,
      message: message
    });
  }

  User.findById(userId, (err, foundUser) => {
    if (foundUser.isActivated === false) {
      return res.render("root", {
        version: pageLang,
        lang: lang,
        message: activatemsg
      });
    } else {

      for (let i = 0; i < foundUser.surveys.length; i++) {

        const survey = foundUser.surveys[i];

        if (survey.id === surveyId) {

          if (versionPage === "de") {
            return res.render("outcome", {
              lang: version.de.lang,
              version: version.de.outcome,
              user: foundUser,
              survey: survey,
              questions: survey.questions,
              respondents: survey.respondents
            });
          } else {
            return res.render("outcome", {
              lang: version.en.lang,
              version: version.en.outcome,
              user: foundUser,
              survey: survey,
              questions: survey.questions,
              respondents: survey.respondents
            });
          }

        }
      }
    }
  });
})


// ------------------------- end result route -------------------------------------

// ----------------------- participation routes -----------------------------------

app.route("/:version/participation/:userid/:surveyid/")
  .get((req, res) => {
    const userId = req.params.userid;
    const surveyId = req.params.surveyid;
    const versionPage = req.params.version;

    User.findById(userId, (err, foundUser) => {
      if (err || !foundUser) {
        console.log(err);
      } else {
        foundUser.surveys.forEach(survey => {
          if (survey.id === surveyId) {
            if (versionPage === "de") {
              return res.render("participation", {
                lang: version.de.lang,
                version: version.de.participation,
                user: foundUser,
                survey: survey,
                questions: survey.questions,
                answers: "",
                msg: ""
              });
            } else {
              return res.render("participation", {
                lang: version.en.lang,
                version: version.en.participation,
                user: foundUser,
                survey: survey,
                questions: survey.questions,
                answers: "",
                msg: ""
              });
            }
          }
        });
      }
    });
  })
  .post((req, res) => {
    const userId = req.params.userid;
    const surveyId = req.params.surveyid;
    const versionPage = req.params.version;

    User.findById(userId, (err, foundUser) => {
      if (err || !foundUser) {
        console.log(err);
        res.status(400);
        res.send("The survey is not found.");
      } else {
        foundUser.surveys.forEach(survey => {
          if (survey.id === surveyId) {

            const newRespondent = new Respondent();

            let notFilled = false;

            survey.questions.forEach((question, i) => {

              const newAnswer = new Answer();

              if (req.body["radiobtn" + i]) {
                const radioBtns = req.body["radiobtn" + i];
                newAnswer.radioButton = radioBtns;

              } else if (req.body["checkbox" + i]) {
                const checkBox = req.body["checkbox" + i];

                if (Array.isArray(checkBox)) {
                  checkBox.forEach(item => {
                    newAnswer.checkBoxes.push(item);
                  });
                } else {
                  newAnswer.checkBoxes.push(checkBox);
                }

              } else if (req.body["shortanstext" + i]) {
                const shortText = req.body["shortanstext" + i];
                newAnswer.textAnswer = shortText;
              }

              if (question.isRequired == true) {
                const checkBox = req.body["checkbox" + i];

                if (req.body["radiobtn" + i] === undefined && question.type === "radiobutton") {
                  notFilled = true;
                } else if (req.body["shortanstext" + i] === "" && question.type === "shortanswer") {
                  notFilled = true;
                } else if (checkBox === undefined && question.type === "checkbox") {
                  notFilled = true;
                }
              }

              newRespondent.answer.push(newAnswer);
            });

            if (notFilled === true) {

              if (versionPage === "de") {
                return res.render("participation", {
                  lang: version.de.lang,
                  version: version.de.participation,
                  user: foundUser,
                  survey: survey,
                  questions: survey.questions,
                  answers: newRespondent.answer,
                  msg: "Bitte antworten Sie alle erforderliche Fragen."
                });
                return res.end();
              } else {
                return res.render("participation", {
                  lang: version.en.lang,
                  version: version.en.participation,
                  user: foundUser,
                  survey: survey,
                  questions: survey.questions,
                  answers: newRespondent.answer,
                  msg: "Please answer all required questions."
                });
                return res.end();
              }
            } else {
              survey.respondents.push(newRespondent);

              foundUser.save(err => {
                if (err) {
                  console.log(err);
                  res.status(400);
                  res.send("Your answers can not be saved.");
                } else {
                  res.redirect("/" + versionPage + "/thanks")
                }
              });
            }

          }

        });
      }
    });
  });

app.get("/:version/thanks", (req, res) => {
  const versionPage = req.params.version;

  if (versionPage === "de") {
    return res.render("thanks", {
      lang: version.de.lang,
      version: version.de.thanks
    });
  } else {
    return res.render("thanks", {
      lang: version.en.lang,
      version: version.en.thanks
    });
  }
});

app.post("/:version/participation/:userid/:surveyid/activate", (req, res) => {
  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;

  User.findById(userId, (err, foundUser) => {
    if (err || !foundUser) {
      console.log(err);
    } else {
      foundUser.surveys.forEach(survey => {
        if (survey.id === surveyId) {

          survey.isActive = true;

          foundUser.save(err => {
            if (err) {
              console.log(err);
            } else {
              if (versionPage === "de") {
                return res.render("participation", {
                  lang: version.de.lang,
                  version: version.de.participation,
                  user: foundUser,
                  survey: survey,
                  questions: survey.questions,
                  answers: "",
                  msg: ""
                });
              } else {
                return res.render("participation", {
                  lang: version.en.lang,
                  version: version.en.participation,
                  user: foundUser,
                  survey: survey,
                  questions: survey.questions,
                  answers: "",
                  msg: ""
                });
              }
            }
          });
        }
      });
    }
  });
});

app.post("/:version/participation/:userid/:surveyid/inactivate", (req, res) => {
  const userId = req.params.userid;
  const surveyId = req.params.surveyid;
  const versionPage = req.params.version;

  User.findById(userId, (err, foundUser) => {
    if (err || !foundUser) {
      console.log(err);
    } else {
      foundUser.surveys.forEach(survey => {
        if (survey.id === surveyId) {

          survey.isActive = false;

          foundUser.save(err => {
            if (err) {
              console.log(err);
            } else {
              if (versionPage === "de") {
                return res.render("participation", {
                  lang: version.de.lang,
                  version: version.de.participation,
                  user: foundUser,
                  survey: survey,
                  questions: survey.questions,
                  answers: "",
                  msg: ""
                });
              } else {
                return res.render("participation", {
                  lang: version.en.lang,
                  version: version.en.participation,
                  user: foundUser,
                  survey: survey,
                  questions: survey.questions,
                  answers: "",
                  msg: ""
                });
              }
            }
          });


        }
      });
    }
  });
});
// ----------------------- end participation routes -------------------------------

// ----------------------- authentication routes ----------------------------------

// activation route
app.get("/:version/activate/:userid", (req, res) => {

  const id = req.params.userid;
  const versionPage = req.params.version;

  let pageLang;
  let lang;
  let message;
  let success;

  if (versionPage === "de") {
    pageLang = version.de.root;
    lang = version.de.lang;
    message = "Konto wurde nicht gefunden.";
    success = "Ihr Konto wurde erfolgreich aktiviert. Sie können sich jetzt einloggen."
  } else {
    pageLang = version.en.root;
    lang = version.en.lang;
    message = "Account not found.";
    success = "Your account was activated successfully. You can login now."
  }


  User.findByIdAndUpdate(id, {
    isActivated: true
  }, (err, foundUser) => {
    if (!err && foundUser) {
      return res.render("root", {
        version: pageLang,
        lang: lang,
        message: success
      });
    } else {
      return res.render("root", {
        version: pageLang,
        lang: lang,
        message: message
      });
    }
  });

});


// register post route
app.post("/:version/register", (req, res) => {

  const versionPage = req.params.version
  const password = req.body.password;
  const confirmpassword = req.body.confirmpassword;
  const email = req.body.email;

  let pageLang;
  let lang;
  let message;

  if (versionPage === "de") {
    pageLang = version.de.root;
    lang = version.de.lang;
    message = "Bitte aktivieren Sie jetzt Ihr Konto. Eine Email zur Aktivierung wurde an Ihre Email-Adresse gesendet.";
  } else {
    pageLang = version.en.root;
    lang = version.en.lang;
    message = "Please activate your account now. An Email for the activation was sent to your email address.";
  }

  if (password === confirmpassword && email !== null) {

    User.findOne({
      email: email
    }, (err, foundUser) => {
      if (err) {
        console.log(err);
      } else if (foundUser) {
        console.log(foundUser);
        return res.redirect("/" + req.params.version);
      } else {
        bcrypt.hash(password, SALT_ROUNDS, function(err, hash) {

          const newUser = new User({
            email: email,
            password: hash,
            name: req.body.name
          });

          newUser.save();
          req.session.userId = newUser.id;

          let mailDetails = {
            from: 'Online Survey <onlinesurvey@surveyon.f2.htw-berlin.de>',
            to: newUser.email,
            subject: 'Online Survey Account Activation',
            html: '<p>Click <a href="http://surveyon.f2.htw-berlin.de/' + versionPage + '/activate/' + newUser.id + '">here</a> to activate your account.</p>'
          };

          mailTransporter.sendMail(mailDetails, function(err, data) {
            if (err) {
              console.log('Error Occurs');
            } else {
              console.log('Email sent successfully');
            }
          });

          return res.render("root", {
            version: pageLang,
            lang: lang,
            message: message
          });
        });
      }
    });

  } else {
    res.redirect("/" + req.params.version);
  }
});


// login post route
app.post("/:version/login", function(req, res, next) {

  const versionPage = req.params.version;

  let pageLang;
  let lang;
  if (versionPage === "de") {
    pageLang = version.de.root;
    lang = version.de.lang;
    message = "Email oder Passwort ist ungültig";
  } else {
    pageLang = version.en.root;
    lang = version.en.lang;
    message = "Email or password is invalid.";
  }

  const email = req.body.emailsignin;
  const password = req.body.passwordsignin;

  User.findOne({
    email: email
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if (result === true) {
            req.session.userId = foundUser.id
            return res.redirect("/" + req.params.version + "/" + foundUser.id + "/surveys");
          } else {
            return res.render("root", {
              version: pageLang,
              lang: lang,
              message: message
            });
          }
        });
      } else {
        return res.render("root", {
          version: pageLang,
          lang: lang,
          message: message
        });
      }
    }
  });
});

// logout route
app.get("/:version/logout/:userid", (req, res) => {
  const id = req.params.userid;
  const versionPage = req.params.version;

  req.session.destroy(err => {
    if (err) {
      return res.redirect("/" + req.params.version + "/edit" + req.params.userid);
    }

    res.clearCookie(SESS_NAME);

    if (versionPage === "de") {
      return res.render("root", {
        version: version.de.root,
        lang: version.de.lang,
        message: ""
      });
    } else {
      return res.render("root", {
        version: version.en.root,
        lang: version.en.lang,
        message: ""
      });
    }
  });
});

// ----------------------- end authentication routes ----------------------------------

// about route
app.get("/:version/about", (req, res) => {
  const versionPage = req.params.version;

  if (versionPage === "de") {
    res.render("about", {
      version: version.de.about,
      lang: version.de.lang
    });
  } else {
    res.render("about", {
      version: version.en.about,
      lang: version.en.lang
    });
  }
});

// ----------------------- reset password routes ----------------------------------

// resetrequest route
app.get("/:version/resetrequest", (req, res) => {

  const versionPage = req.params.version;

  if (versionPage === "de") {
    return res.render("resetrequest", {
      version: version.de.resetrequest,
      lang: version.de.lang
    });
  } else {
    return res.render("resetrequest", {
      version: version.en.resetrequest,
      lang: version.en.lang
    });
  }
});

// reset route
app.get("/:version/reset/:userid", (req, res) => {

  const versionPage = req.params.version;

  if (versionPage === "de") {
    return res.render("reset", {
      version: version.de.reset,
      lang: version.de.lang,
      message: "",
      id: req.params.userid
    });
  } else {
    return res.render("reset", {
      version: version.en.reset,
      lang: version.en.lang,
      message: "",
      id: req.params.userid
    });
  }
});

// resetrequest post route
app.post("/:version/resetrequest", (req, res) => {
  const versionPage = req.params.version;
  const email = req.body.email;

  let pageLang;
  let lang;
  let message;
  let msgnotfound;
  if (versionPage === "de") {
    pageLang = version.de.root;
    lang = version.de.lang;
    message = "Eine Email wurde versandt. Bitte checken Sie Ihre Mailbox.";
    msgnotfound = "Ein Konto mit der eingegebenen Email-Adresse wurde nicht gefunden.";
  } else {
    pageLang = version.en.root;
    lang = version.en.lang;
    message = "An email has been sent to your email-address. Please check your inbox.";
    msgnotfound = "An account with the email-address was not found.";
  }

  User.findOne({
    email: email
  }, (err, foundUser) => {
    if (!err && foundUser) {

      let mailDetails = {
        from: 'Online Survey <onlinesurvey@surveyon.f2.htw-berlin.de>',
        to: email,
        subject: 'Password Reset Online Survey',
        html: '<p>Click <a href="http://surveyon.f2.htw-berlin.de/' + versionPage + '/reset/' + foundUser.id + '">here</a> to reset your password.</p>'
      };

      mailTransporter.sendMail(mailDetails, function(err, data) {
        if (err) {
          console.log('Error Occurs');
        } else {
          console.log('Email sent successfully');
        }
      });


      return res.render("root", {
        version: pageLang,
        lang: lang,
        message: message
      });

    } else {
      return res.render("root", {
        version: pageLang,
        lang: lang,
        message: msgnotfound
      });
    }
  });

});

// reset post route
app.post("/:version/reset/:userid", (req, res) => {

  const versionPage = req.params.version;
  const id = req.params.userid;
  const password = req.body.password;

  let pageLang;
  let lang;
  let message;

  if (req.body.confirmpassword !== password) {
    if (versionPage === "de") {
      pageLang = version.de.reset;
      lang = version.de.lang;
      message = "Ihre Passwortbestätigung ist nicht identisch.";
    } else {
      pageLang = version.en.reset;
      lang = version.en.lang;
      message = "Your password confirmation doesn't match.";
    }
    return res.render("reset", {
      version: pageLang,
      lang: lang,
      id: id,
      message: message
    });
  } else {

    if (versionPage === "de") {
      pageLang = version.de.root;
      lang = version.de.lang;
      message = "Ihr Passwort wurde erfolgreich aktualisiert.";
    } else {
      pageLang = version.en.root;
      lang = version.en.lang;
      message = "Your password has been successfully updated.";
    }

    bcrypt.hash(password, SALT_ROUNDS, function(err, hash) {
      User.findByIdAndUpdate(id, {
        password: hash
      }, (err) => {
        if (!err) {
          return res.render("root", {
            version: pageLang,
            lang: lang,
            message: message
          });
        }
      });

    });

  }
});

// ----------------------- reset password routes ----------------------------------






app.listen(PORT, function() {
  console.log("Server started.");
});
