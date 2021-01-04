router.post('/migrate-users', upload.single('file'), (req, res) => {
    Organisation.findOne({ name: { $regex: req.body.name, $options: 'i' }})
    .then(organisation => {
        if (!organisation) {
            return res.send('Organisation not found')
        }
        let userFile = fs.readFileSync(req.file.path)
        let users = JSON.parse(userFile)
        users.map(user => {
            const filter = {
                $or: [
                    { phone: user.phone_number },
                    { email: user.email },
                    { username: user.user_name }
                ]
            }
            User.findOne(filter)
            .then(async oldUser => {
                const bloodGroup = await BloodGroup.findOne({ bloodGroup: `/${user?.blood_group}$/` })
                const bloodGroupId = bloodGroup?._id || ''
                if (oldUser) {
                    oldUser.organisation.push({
                        organisationId: organisation._id
                    })
                    oldUser.save()
                    .then(result => {
                        console.log(result)
                    })
                    .catch(e => console.log(e))
                } else {
                    let addUser = {
                        name: user.name,
                        email: user.email,
                        phone: user.phone_number,
                        password: user.password,
                        username: user.user_name,
                        profileImage: user.profileImage,
                        postal_code: parseInt(user.postal_codes[0].S),
                        'organisation.docVerify': user.verified == 'TRUE',
                        'organisation.orgUserStatus': user.is_user_enabled == 'TRUE',
                        emergency_number: user.em_ph_number,
                        bloodGroupId: bloodGroupId,
                        organisation: {
                            organisationId: organisation._id
                        }
                    }
                    const newUser = new User(addUser)
                    newUser.save()
                    .then(result => {
                        console.log(result)
                    })
                    .catch(e => console.log(e))
                }
            })
            .catch(e => console.log(e))
        })
        return res.send('done')
    })
    .catch(e => console.log(e))
})