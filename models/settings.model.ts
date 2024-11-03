import {model, Schema} from 'mongoose'

let schema = new Schema({
    name: String,
    email: String,
    phone: String,
    footer: String,
    address: Object,
    city: Object,
    map_link: String,
    contact_page_description: Object,
    about_page_description: Object,
    description: Object,
    logo: String,
    zoho_email: {
        host: String,
        port: String,
        address: String,
        password: String,
        active: {
            type: Boolean,
            default: false
        },
    },
    social_media_link: {
        facebook: String,
        twitter: String,
        instagram: String,
        linkedin: String,
        youtube: String,
        whatsapp: String,
    },
    stay_connected: {
        twitter: String,
        facebook: String,
        linkedin: String,
        instagram: String,
    }

}, {timestamps: true})

const Settings = model('settings', schema)
export default Settings
