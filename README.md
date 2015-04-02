# video_app
This is an app for viewing cross cultural video tags.

## Set up
#### Prerequisites
Install the following prerequisites:

<a href=https://nodejs.org/>NodeJS</a>

<a href=https://www.mongodb.org/>MongoDB</a>

This repository also includes Timeline JS and Bootstrap.

#### Set up DB with existing data

Get the 'dump/' directory from the ftp server. This includes the data for the AirAsia and US Midterm Elections events.
Run MongoDB and then use the mongorestore command:
```
mongorestore dump/
```
This also includes 2 users (username: admin, password: admin567) and (username: user, password: user123) for testing.

#### To run the app
If you are running the application on your machine, you can access it at http://localhost:3000 
```
node app
```

#### If you are missing node modules when trying to run the app
```
npm install <module>
```

## Details
#### Login system
You must be logged in to view any of the pages. There are 2 user roles: Admin and None. Any new accounts
must be made by an admin. It is implemented using <a href=http://passportjs.org/>Passport</a> and 
<a href=https://nodejs.org/api/crypto.html>Crypto</a>.

#### Admin powers
Admins can add, edit, and delete the relationships, files, and users.

#### Timeline
The timeline is made using <a href=http://timeline.knightlab.com/>Timeline JS</a>. It loads their original timeline
and then overrides the CSS to style it in the appropriate way. It also uses some javascript to do some of the
styling and moving of elements after the timeline is rendered. This is done because we cannot build Timeline JS
directly. It is possible to specify a date in the URL and cause the timeline to begin at a certain slide. The
source used to build the timeline is a JSON delivered from 'timelinedata/{event}/{date}'.

#### Images and videos
The images and videos are stored using <a href=http://docs.mongodb.org/manual/core/gridfs/>GridFS</a>. The videos
are played using the HTML5 video element. It sources from 'videos/{video_id}' which allows streaming.

## Deployment
#### Tutorials
http://dailyjs.com/2010/03/15/hosting-nodejs-apps/

https://www.digitalocean.com/community/tutorials/how-to-deploy-node-js-applications-using-systemd-and-nginx

#### Tips you might need
You may need to change line 16 of routes/index.js to connect to the proper db url (replacing
'mongodb://localhost:27017/gridfs').

## Todo
* Manage rels edit
* Manage files edit
* Manage users edit
* Manage files delete
