import User from '../models/user.model'
import {s3Upload} from '../utils/awsS3Bucket';
import mongoose from "mongoose";
import {deleteFile, uploadFile, uploadWebpImage} from "../utils/s3bucket";
// import Frontend from "../models/frontend.model";
// import sendMessage from "../utils/beem_sms";

export const uploadFiles = async (req, res, next) => {
    try {
        const {user} = res.locals || {};
        const isUser = await User.findById(user._id);
        if (!isUser) {
            return res.status(500).json({
                error: true,
                msg: "Permission Denied"
            })
        }
        const results = (await s3Upload(req.files, isUser?.email)).map(d => d.Location);
        return res.status(200).json({
            error: false,
            msg: 'File uploaded successfully!',
            data: results
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            msg: error.message
        })
    }
}

export const singleFileUplaod = async (req, res) => {
    try {
        let {body, files} = req;
        console.log(files)
        console.log(body)
        let _id = body._id || new mongoose.Types.ObjectId()
        let image_name = body.image_name || 'image';
        let image = await uploadFile(files.image, 'blog-site/' + _id, image_name)
        return res.status(200).send({
            error: false,
            msg: 'Successfully uploaded',
            data: image
        })
    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const singleImageUplaod = async (req, res) => {
    try {
        let {body, files} = req;
        const mimetypes = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif', 'image/svg+xml'];
        if(mimetypes.includes(files?.image?.mimetype) === false) {
            return res.status(404).send({
                error: true,
                msg: 'Only the image file is acceptable',
            })
        }
        let _id = body._id || new mongoose.Types.ObjectId()
        let image_name = body.image_name || 'image';
        let image = await uploadWebpImage({file: files.image, folder: 'blog-site/' +_id, name: image_name, size: body.size})
        return res.status(200).send({
            error: false,
            msg: 'Successfully uploaded',
            data: image
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const multipleFileUplaod = async (req, res) => {
    let {body, files} = req;
    try {
        
        const images = [];
        for (let i = 0; i < (files||body).images.length; i++) {
            let _id = body._id || new mongoose.Types.ObjectId()
            let image_name = ((body.image_name) + i) || 'image';
            let image = await uploadFile(files.images[i], 'blog-site/' + _id, image_name)
            images.push(image)
        }
        return res.status(200).send({
            error: false,
            msg: 'Successfully uploaded',
            data: images,
        })
    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: e,
            files
        })
    }
}

export const fileRemoveFromAws = async (req, res) => {
    try {
        let {body} = req;
        if (typeof body.file === 'string') {
            await deleteFile(body?.file?.split('.com/')[1])
            return res.status(200).send({
                error: false,
                msg: 'Successfully deleted',
                data: body.file
            })
        }
        return res.status(200).send({
            error: true,
            msg: 'Wrong input',
        })

    } catch (e) {
        console.log(e)
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const handleFileRemoveFromAws = async (file: any) => {
    try {
        if (typeof file === 'string') {
            await deleteFile(file?.split('.com/')[1])
            return true
        }
        return false
    } catch (e) {
        console.log(e)
        return false
    }
}

/*
*  option = { data, model, pullObject }
* data => array or object
* */
export const handleFileRemoveFromDatabase = async (option: any) => {
    try {
        if (option?.data?.length > 0) {
            if (typeof option?.data[0] === 'string') {
                await option.model.updateOne({_id: new mongoose.Types.ObjectId(option.id)}, {
                    $pull: option.pullObject
                })
                return true

            } else {

            }
        } else if (typeof option?.data === 'object') {

        } else if (typeof option?.data === 'string') {

        }

        return false
    } catch (e) {
        console.log(e)
        return false
    }
}


/*
*
* Frontend Model's file delete
*
* */
// export const awsFileRemoveHandleFromFrontend = async (req, res) => {
//     try {
//         let {body} = req;
//         if (typeof body.file === 'string') {
//             console.log(body)
//             await deleteFile(body?.file?.split('.com/')[1])
//             switch (body.model) {
//                 case 'frontends': {
//                     if(body.type === "object") {
//                         await Frontend.updateOne({}, {$unset: body.option})
//                     } else if (body.type === 'array') {
//                         await Frontend.updateOne({}, {$pull: body.option})
//                     }
//                     // else if(body.type === 'arrayOfObject') {
//                     //     await Frontend.updateOne(body.filter, {$unset: {"casts.crew.$[].withBase":""}})
//                     // }
//                     break
//                 }
//             }
//             return res.status(200).send({
//                 error: false,
//                 msg: 'Successfully deleted',
//             })
//         }
//         return res.status(200).send({
//             error: true,
//             msg: 'Wrong input',
//         })
//     } catch (e) {
//         console.log(e)
//         return res.status(500).send({
//             error: true,
//             msg: 'Server failed'
//         })
//     }
// }

