const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://gokulgopalan51_db_user:CygJ0mw43gL01T0l@cluster0.a6jitjg.mongodb.net/mediadb?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
    console.log('Connected to MongoDB (mediadb)');
    
    // Define a basic schema
    const fluxSchema = new mongoose.Schema({}, { strict: false });
    const Flux = mongoose.model('Flux', fluxSchema, 'fluxes');

    const fluxes = await Flux.find({ }).limit(20);
    console.log('Total fluxes in db: ' + fluxes.length);
    fluxes.forEach(f => {
        console.log('- ID: ' + f._id + ', userId: ' + f.userId + ', mediaType: ' + f.mediaType + ', isPersistent: ' + f.isPersistent + ', isStory: ' + f.isStory + ', status: ' + f.status + ', expiresAt: ' + f.expiresAt);
    });
    
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
