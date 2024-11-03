import Settings from "../models/settings.model";

export const fetchSiteSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne().select('-zoho_email')
        return res.status(200).send({
            error: false,
            msg: 'Successfully gets settings',
            data: settings
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const fetchSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne()
        return res.status(200).send({
            error: false,
            msg: 'Successfully gets settings',
            data: settings
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}


export const updateSettings = async (req, res) => {
    try {
        let {body} = req
        await Settings.updateOne({}, body, {upsert: true});
        return res.status(200).send({
            error: false,
            msg: 'Successfully updated settings'
        })
    } catch (e) {
        return res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

// export const emailUpdate = async (req, res) => {
//     try {
//         let {body} = req
//         if (body?.sendgrid?.active === true) {
//             await Settings.findOneAndUpdate({}, {...body, gmail: {active: false}, hostinger: {active: false}}, {upsert: true})
//             return res.status(200).send({
//                 error: false,
//                 msg: 'Successfully updated settings'
//             })
//         } else if (body?.gmail?.active === true) {
//             await Settings.findOneAndUpdate({}, {...body, sendgrid: {active: false}, hostinger: {active: false}}, {upsert: true})
//             return res.status(200).send({
//                 error: false,
//                 msg: 'Successfully updated settings'
//             })
//         } else if (body?.hostinger?.active === true) {
//             await Settings.findOneAndUpdate({}, {...body, gmail: {active: false}, sendgrid: {active: false}}, {upsert: true})
//             return res.status(200).send({
//                 error: false,
//                 msg: 'Successfully updated settings'
//             })
//         }

//         await Settings.findOneAndUpdate({}, {...body}, {upsert: true})
//         return res.status(200).send({
//             error: false,
//             msg: 'Successfully updated settings'
//         })
//     } catch (e) {
//         return res.status(500).send({
//             error: true,
//             msg: 'Server failed'
//         })
//     }
// }



