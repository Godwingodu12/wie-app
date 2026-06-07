const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://gokulgopalan51_db_user:CygJ0mw43gL01T0l@cluster0.a6jitjg.mongodb.net/media-service?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    const fluxSchema = new mongoose.Schema({}, { strict: false });
    const Flux = mongoose.model('Flux', fluxSchema, 'fluxes');

    const fluxes = await Flux.find({ isDeleted: false }).limit(50);
    console.log('Total fluxes: ' + fluxes.length);
    fluxes.forEach(f => {
        console.log('- ' + (f.caption ? f.caption.substring(0, 20) : 'No Caption') + ' | persistent:' + f.isPersistent + ' | story:' + f.isStory + ' | archived:' + f.isArchived + ' | status:' + f.status);
    });
    
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
