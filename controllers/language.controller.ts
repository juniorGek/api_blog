import Language from "../models/language.model"

// language
export const getLanguages = async (req, res) => {
    try {
        let languages = await Language.find({active:true}, 'name code flag active default')
        if (languages?.length === 0) {
            await Language.create({
                name: 'English',
                code: 'en',
                flag: 'US',
                default: true
            })
            languages = await Language.find({}, 'name code flag active default')
        }
        return res.status(200).send({
            error: false,
            msg: 'Successfully gets languages',
            data: languages
        })

    } catch (e) {
        res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}
export const getAllLanguages = async (req, res) => {
    try {
        let languages = await Language.find({}, 'name code flag active default')
        if (languages?.length === 0) {
            await Language.create({
                name: 'English',
                code: 'en',
                flag: 'US',
                default: true
            })
            languages = await Language.find({}, 'name code flag active default')
        }
        return res.status(200).send({
            error: false,
            msg: 'Successfully gets languages',
            data: languages
        })

    } catch (e) {
        res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const postLanguage = async (req, res) => {
    try {
        const {body} = req
        if (body._id) {
            if (body.default === true) {
                await Language.updateMany({}, {default: false})
                await Language.findByIdAndUpdate(body._id, {
                    default: true,
                    active: true,
                })
                return res.status(200).send({
                    error: false,
                    msg: 'Successfully updated default language'
                })
            }
            if (body.default === false) {
                return res.status(401).send({
                    error: true,
                    msg: 'At least a language should be default'
                })
            }
            if (body.active !== undefined) {
                let language = await Language.findById(body._id, 'default active')
                if (language?.default === false) {
                    language.active = body.active
                    await language.save()
                    return res.status(200).send({
                        error: false,
                        msg: 'Successfully updated language status'
                    })
                }
                return res.status(401).send({
                    error: true,
                    msg: 'Default language status is not changeable'
                })
            }
            await Language.findByIdAndUpdate(body._id, {
                name: body.name,
                code: body.code,
                flag: body.flag,
                rtl: body.rtl
            })
            return res.status(200).send({
                error: false,
                msg: 'Successfully updated language'
            })
        } else {
            await Language.create({
                name: body.name,
                code: body.code,
                flag: body.flag,
                rtl: body.rtl
            })
            return res.status(200).send({
                error: false,
                msg: 'Successfully added language'
            })
        }
    } catch (e) {
        res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const deleteLanguage = async (req, res) => {
    try {
        const {query} = req
        console.log(query?._id)
        await Language.findByIdAndDelete(query._id)
        return res.status(200).send({
            error: false,
            msg: 'Successfully deleted language'
        })
    } catch (e) {
        res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }
}

export const getLanguageTranslations = async (req, res) => {
    try {
        const languages = await Language.find({active: true}, 'name code flag default translation');
        return res.status(200).send({
            error: false,
            msg: 'Successfully gets Languages',
            data: languages?.map(d => ({
                ...d["_doc"],
                translation: d.translation?.reduce((acc, d) => {
                    acc[d.key] = d.value
                    return acc
                }, {})
            }))
        })
    } catch (error) {
        res.status(500).send({
            error: true,
            msg: 'Server failed'
        })
    }

}

export const postLanguageTranslations = async (req, res) => {
    try {
        let {body} = req
        for (const _id of Object.keys(body)) {
            await Language.findByIdAndUpdate(_id, {
                translation: Object.keys(body[_id])?.map(key => ({key: key, value: body[_id][key]}))
            })
        }
        return res.status(200).json({
            error: false,
            msg: 'Successfully updated translations'
        })
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}