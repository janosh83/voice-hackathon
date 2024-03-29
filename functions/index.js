"use strict";
const functions = require("firebase-functions");
const {dialogflow, Suggestions, BasicCard, Button, Image} = require("actions-on-google");
const admin = require("firebase-admin");
const app = dialogflow();
const superagent = require("superagent");

//Paste Firebase db auth info here
// Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyAwpgYykZdR-SERuAMZRnhgpxTY3LwZtKY",
    authDomain: "demo1-7e858.firebaseapp.com",
    databaseURL: "https://demo1-7e858.firebaseio.com",
    projectId: "demo1-7e858",
    storageBucket: "demo1-7e858.appspot.com",
    messagingSenderId: "954635919444",
    appId: "1:954635919444:web:47012b2b9bc100b9"
  };
  // Initialize Firebase
  admin.initializeApp(firebaseConfig);
//Rewrite firebase.initializeApp(config); to admin.initializeApp(config);

const db = admin.database();

app.intent('Default Welcome Intent', conv => {
  conv.ask(`What would you like to do during your vacation.`);
  conv.ask(new Suggestions(['surfing',"beach","party", "golf"]));
 });

// app.intent("finallink",
// (conv) => {
//    return conv.ask(`Here is a <a href="${conv.user.storage.deep_link}">link</a>. Click to booking.`);

    // if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
    //   conv.ask('Sorry, try this on a screen device or select the ' +
    //     'phone surface in the simulator.');
    //   return;
    // }

    // conv.ask('This is a basic card example.');
    // // Create a basic card
    // conv.ask(new BasicCard({
    //   text: `This is a basic card.  Text in a basic card can include "quotes" and
    //   most other unicode characters including emoji 📱.  Basic cards also support
    //   some markdown formatting like *emphasis* or _italics_, **strong** or
    //   __bold__, and ***bold itallic*** or ___strong emphasis___ as well as other
    //   things like line  \nbreaks`, // Note the two spaces before '\n' required for
    //                               // a line break to be rendered in the card.
    //   subtitle: 'This is a subtitle',
    //   title: 'Title: this is a title',
    //   buttons: new Button({
    //     title: 'This is a button',
    //     url: conv.user.storage.deep_link,
    //   }),
    // }));

// }
//);


app.intent("activity",
 (
   conv,
   { activity }) => {
    conv.user.storage.activity = activity;
    conv.ask('What weather do you prefer? Cold or warm');
    return conv.ask(new Suggestions(['cold','warm']));  
 }
);

app.intent("weather", async (conv, {weather_condition}) => {
    conv.user.storage.weather_condition = weather_condition;
    var activities = conv.user.storage.activity;
  	var selected_cities = "";
  	var first_value = true;
    let all_cities = db.ref("cities");
    let snapshots = await all_cities.once("value");
    if (snapshots.exists) {
        let data = snapshots.val();
        var i;
        for (i = 0; i < data.length; i++)
        {
          if (data[i].weather_conditions == weather_condition)
          { 
            var j;
            for (j = 0; j < data[i].activities.length; j++)
            {
               
                if (data[i].activities[j] == activities) //add here for through activities array (once it is array)
                {
                  if (first_value)
                  {
                    selected_cities = selected_cities.concat(data[i].code);
                    first_value = false;
                  }
                  else
                  {
                    selected_cities = selected_cities.concat(",",data[i].code);
                  }
                }
            }
          }
        }
//         let response1 = `Selected cities with ${activities} is ${selected_cities}`;
//         return conv.ask(response1);
        return superagent
        .get(`https://kiwicom-prod.apigee.net/v2/search?fly_from=PRG&fly_to=${selected_cities}&date_from=21%2F06%2F2019&date_to=22%2F06%2F2019&return_from=05%2F06%2F2019&return_to=05%2F07%2F2019&nights_in_dst_from=5&nights_in_dst_to=14&max_fly_duration=20&flight_type=round&adults=1&max_stopovers=2&vehicle_type=aircraft&limit=30&sort=price`)
        .set("apiKey", "Ylv30FGwY2k5KseX5JNzPMyFR4hXYsTD")
        .set("Accept", "application/json")
        .then(function(response) {
            console.log("Got response");
            console.log(response.body);
            const price = response.body.data[0].price;
            const from = response.body.data[0].cityFrom;
            const destination = response.body.data[0].cityTo;
            const activity = conv.user.storage.activity;
            conv.user.storage.deep_link = response.body.data[0].deep_link;

            if (!conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT')) {
              conv.ask('I am sending you reservation link to your email.');
              return;
            }

            conv.ask(`${destination} is great place for ${activity} in ${weather_condition} weather. I found the cheapest flight ticket from ${from} on kiwi.com you will love for just ${price} EUR. Here is the link.`);
            // Create a basic card
            conv.ask(new BasicCard({
              text: `From: __${from}__ To: __${destination}__  \n
Date: __${response.body.data[0].local_departure.split("T")[0]}__  \n
Duration: __${response.body.data[0].nightsInDest} nights__  \n
Price: __${price} EUR__  \n`, // Note the two spaces before '\n' required for
                                          // a line break to be rendered in the card.
              // subtitle: `From: ${from} To: ${destination}`,
              title: 'Your next trip',
              buttons: new Button({
                title: 'Go to booking',
                url: conv.user.storage.deep_link,
              }),
            }));

            //const weather_condition = conv.user.storage.activity;
            //conv.ask(new Suggestions(['yes','no']));      
            //return conv.ask(`${destination} is great place for ${activity} in ${weather_condition} weather. I found the cheapest flight ticket from ${from} on kiwi.com you will love for just ${price} EUR. Would you like to book this ticket?`);      
        });
    }
    else
    {
        return conv.ask(`I have no data`);
    }
});

app.intent("flight", (conv) => {
   //Turn on fulfillment for intent "help" and change the text
   return superagent
     .get("https://kiwicom-prod.apigee.net/v2/search?fly_from=FRA&fly_to=BCN&date_from=05%2F12%2F2019&date_to=25%2F12%2F2019&return_from=20%2F12%2F2019&return_to=25%2F12%2F2019&nights_in_dst_from=2&nights_in_dst_to=14&max_fly_duration=20&flight_type=round&adults=1&max_stopovers=2&vehicle_type=aircraft&limit=30&sort=price")
     .set("apiKey", "Ylv30FGwY2k5KseX5JNzPMyFR4hXYsTD")
     .set("Accept", "application/json")
       .then(function(response) { conv.ask(
     response.body); });
//  return conv.ask("bla bla");
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);