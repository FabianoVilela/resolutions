// Create a new collection on Mongo database
Resolutions = new Mongo.Collection('resolutions');

if (Meteor.isClient) {
  // Subscribe to resolutions collection
  Meteor.subscribe("resolutions");

  Template.body.helpers({
    resolutions: function() {
      if (Session.get('hideFinished')) {
        return Resolutions.find({checked: {$ne: true}});
      } else {
          return Resolutions.find();
      }
    },
    hideFinished: function() {
      return Session.get('hideFinished');
    }
  });

  Template.body.events({
    'submit .new-resolution': function(event) {
      var title = event.target.title.value;

      // Call a method to add new resolution passing title as parameter
      Meteor.call("addResolution", title);

      // Eliminating previews value from the field
      event.target.title.value = "";
			
			// Prevent browser to reload
      return false;
    },
    // New event for hide finished resolutions
    'change .hide-finished': function(event) {
      Session.set('hideFinished', event.target.checked);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  })

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // Code to run on server at startup
  });

  Meteor.publish("resolutions", function() {
    return Resolutions.find({
      // Advance Mongo query
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  });
}

/* Methods that application will have access to in the client side 
and will be able to block things based on user id (weather user is logged in) */
Meteor.methods({
  // Method to add new resolution
  addResolution: function(title) {
    Resolutions.insert({
      title : title,
      createdAt: new Date(),
      owner: Meteor.userId()
    });
  },

  // Method to update checked list when checkbox is clicked
  updateResolution: function(id, checked) {
    var res = Resolutions.findOne(id);

    if (res.owner !== Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    Resolutions.update(id, {$set:{checked: checked}})
  },

  // Method to remove resolution
  deleteResolution: function(id) {
    var res = Resolutions.findOne(id);
    // If is not the owner of the resolution don't allow to remove it.
    if (res.owner !== Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    Resolutions.remove(id);
  },

  // Method for private button to make resoulion private
  setPrivate: function(id, private) {
    // Find one resolution on mongoDB and set it to res
    var res = Resolutions.findOne(id);
    // If is not the current owner don't allow them
    if (res.owner !== Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    Resolutions.update(id, {$set:{private: private}})

  }
});