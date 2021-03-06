"use strict";

var errorLog = require("./errorlog");
var Promise = require("bluebird");

if (!global.fetch){
  var Promise = require("bluebird");
  require('isomorphic-fetch');
}

function getMe(auth){
  var apiPath = auth.domain + "/api/users/me";
  return fetch(apiPath, {
    method: "GET",
    headers: auth.getHeaders()
  }).then((res) => {
    return res.json();
  })
  .catch(errorLog(apiPath));
}

function getMyCourses(auth){
  var apiPath = auth.domain + "/api/users/me?withCourses=true";
  return fetch(apiPath, {
    method: "GET",
    headers: auth.getHeaders()
  }).then((res) => res.json())
    .then((json) => {
        return Object.keys(json["courses"]).map((k) => json["courses"][k]);
  }).catch(errorLog(apiPath));
}

function getMySections(auth){
  var apiPath = auth.domain + "/api/users/me?withSections=true";
  return fetch(apiPath, {
    method: "GET",
    headers: auth.getHeaders()
  }).then((res) => {
    return res.json();
  }).then((json) => {
    return json["sections"];
  }).catch(errorLog(apiPath));
}

function getMyEvents(auth){
  // We're going to do a slightly more complicated request to get the
  // course name with each event
  var apiPath = auth.domain + "/api/users/me?withSections=true&withCourses=true&withSectionEvents=true";
  return fetch(apiPath, {
    method: "GET",
    headers: auth.getHeaders()
  }).then((res) => {
    return res.json()
  }).then((resJson) => {
    return resJson["sectionEvents"].map((evt) => {

      var sections = resJson["sections"];
      var courses = resJson["courses"];

      // each event needs to find it's course
      // to do that we need to find it's section
      var sec;
      for (var i = 0;i < sections.length;i++){
        if (sections[i]._id == evt.section){
          sec = sections[i];
          break;
        }
      }

      // Now use the section to get the course
      var crs = courses[sec.course];

      evt.sectionNumbers = sec.sectionNumbers;
      evt.courseNumber = crs.department + " " + crs.courseNumber;
      evt.courseName = crs.name;
      evt.courseDescription = crs.description;
      evt.courseId = crs._id;

      return evt;

    }).sort(sortEventsByDate);
  }).catch(errorLog(apiPath));
}

function sortEventsByDate(a, b) {
  if(a.hasOwnProperty('info') && a.info.hasOwnProperty('times') && a.info.times.length > 0 &&
      b.hasOwnProperty('info') && b.info.hasOwnProperty('times') && b.info.times.length > 0) {
        return new Date(a.info.times[0].start).getTime() >= (new Date(b.info.times[0].start)).getTime();
  }
  return true;
}

module.exports.getMe = getMe;
module.exports.getMyEvents = getMyEvents;
module.exports.getMySections = getMySections;
module.exports.getMyCourses = getMyCourses;
