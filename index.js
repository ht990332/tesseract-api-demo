const express = require("express");
const fileUpload = require("express-fileupload")
const app = express();
const router = express.Router();
const tesseract = require("node-tesseract-ocr")
const cors = require('cors');
const path = require('path')
const fs = require("fs");


app.use(express.json());

// In real life, only allow the frontend ip/port.
router.use(cors())

// Middlware
const fileExistsCheck = (req, res, next) => {
	if (!req.files) {
		return res.sendStatus(400)
	}
	next()
}

const fileTypeCheck = (req, res, next) => {
        const files = req.files
        const filemimetype = req.files.data['mimetype']
        if (!(filemimetype.includes("image\/png") || filemimetype.includes("image\/jpeg") ||  filemimetype.includes("image\/jpg")))
        {
            return res.sendStatus(400);
        }
        next()
}
//

router.post('/',
	fileUpload({ createParentPath: true}),
	fileExistsCheck,
	fileTypeCheck,
	(req, res) => {
		let filepath = ""
		const files = req.files
		Object.keys(files).forEach(key => {
			filepath = path.join(__dirname, 'input', files[key].name)
			files[key].mv(filepath, (err) => {
				if(err)
				{
					return res.sendStatus(500)
				}
			})
		})
		const config = {
			lang: "eng",
			oem: 1,
			psm: 3,
		}
		tesseract.recognize(filepath, config).then((text) => {
			// now that we have text, we can delete the temp image.
            fs.unlink(filepath, function (err) {
            	if (err)
            	{
            		console.error(err.message);
            	}
            });

            // return the text to client
			res.set('content-type', 'text/plain');
			return res.send(text)
		}).catch((err) => {
			return res.sendStatus(500)
		})		
	}
);

app.use("/",router)

app.listen(3456,() => {
	console.log("Started on http://127.0.0.1:3456");
})