var clientMainService = require("phront/test/data/client-main.mod/main.mjson").montageObject,
Collection = require("phront/data/main.mod/model/collection").Collection,
Image = require("phront/data/main.mod/model/image").Image;


exports.createUpdateDeleteCollectionImage = function() {
    var aCollection =  clientMainService.createDataObject(Collection);

    aCollection.originId = null;
    aCollection.title = "Test Collection Title";
    aCollection.description = "Test Collection description";
    aCollection.descriptionHtml = "Test Collection descriptionHtml";
    aCollection.products = null;
    aCollection.image = null;

    return clientMainService.saveChanges()
    //return clientMainService.saveDataObject(aCollection)
    .then(function(createCompletedOperation) {
        return createCompletedOperation.data;
    },function(error) {
        console.error(error);
    })
    .then(function(saveOperationResolved) {
        // change a simple property
        aCollection.title = "---> Test Collection Title Changed";
        return clientMainService.saveChanges();
        //return clientMainService.saveDataObject(aCollection);
    },function(error) {
        console.error(error);
    })
    .then(function(saveOperationResolved) {
        // change a simple property and a to-one*/

        var imageDescriptor = clientMainService.objectDescriptorForType(Image);

        var image = clientMainService.createDataObject(imageDescriptor);
        image.originId = null;
        image.altText = "altText";
        image.originalSrc = "http://originalSrc.com/image.png";
        image.transformedSrc = null;
        aCollection.image = image;
        aCollection.title = "Test Collection Title Changed again";

        //Totally new to test
        return clientMainService.saveChanges();
        //return clientMainService.saveDataObject(aCollection.image);
        //return Promise.all([
        //    clientMainService.saveDataObject(aCollection.image),
        //    clientMainService.saveDataObject(aCollection)]);
    },function(saveError) {
        console.error(saveError);
    })
    .then(function(saveCompletedOperation) {
        // var collection = saveCompletedOperation.data;
        clientMainService.deleteDataObject(aCollection.image);
        clientMainService.deleteDataObject(aCollection);
        return clientMainService.saveChanges();

        // return Promise.all([
        //     clientMainService.deleteDataObject(aCollection.image),
        //     clientMainService.deleteDataObject(aCollection)]);

    },function(saveFailedOperation) {
        console.error(saveFailedOperation);
    })
    .then(function(saveOperationResult) {
        console.log("done!!");
        return true;
    },function(saveError) {
        console.error(saveError);
        return saveError;
    });

}

