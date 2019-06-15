"use strict";
const functions = require("firebase-functions");
const {dialogflow, Suggestions} = require("actions-on-google");
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
  conv.ask(new Suggestions(['surfing',"beach","party","monuments", "golf"]));
 });

 app.intent("destination",
 (
   conv,
   { activity, weather_condition }) => {
    let act = activity;
    let weather = weather_condition;
    conv.ask(`Barcelona is greate place for ${activity}. Would you like to book a flight ticket?`);
    return conv.ask(new Suggestions(['yes','no']));  

 }
);


app.intent("activity",
 (
   conv,
   { activity }) => {
    conv.user.storage.activity = activity;
    conv.ask('What weather do you prefer? Cold or warm');
    return conv.ask(new Suggestions(['cold','warm']));  
 }
);
 

app.intent("weather1",
 (
    conv,
   { weather_condition }) => {
  	conv.user.storage.weather_condition = weather_condition;
    conv.ask(`Barcelona is great place for ${conv.user.storage.activity} in ${weather_condition} weather. Would you like to book a flight ticket?`);
    return conv.ask(new Suggestions(['yes','no']));  
 }
);

app.intent("weather", async (conv, {weather_condition}) => {
    var activities = conv.user.storage.activity;
//    var weather_condition = ["warm"];
  	var selected_cities = "";
  	var first_value = true;
    let all_cities = db.ref("cities");
    let snapshots = await all_cities.once("value");
    if (snapshots.exists) {
        let data = snapshots.val();
        var i;
        for (i = 0; i < data.length; i++)
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
//         let response1 = `Selected cities with ${activities} is ${selected_cities}`;
//         return conv.ask(response1);
        return superagent
            .get(`https://kiwicom-prod.apigee.net/v2/search?fly_from=FRA&fly_to=${selected_cities}&date_from=05%2F12%2F2019&date_to=25%2F12%2F2019&return_from=20%2F12%2F2019&return_to=25%2F12%2F2019&nights_in_dst_from=2&nights_in_dst_to=14&max_fly_duration=20&flight_type=round&adults=1&max_stopovers=2&vehicle_type=aircraft&limit=30&sort=price`)
            .set("apiKey", "Ylv30FGwY2k5KseX5JNzPMyFR4hXYsTD")
            .set("Accept", "application/json")
            .then(function(response) { conv.ask(
            response.body); });
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