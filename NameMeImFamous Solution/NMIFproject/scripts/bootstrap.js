/**

* @author admin

*/


//directory.setLoginListener("chLogin");
// cleanup database 
ds.PlayerAccount.all().forEach(function(p) { p.status = "not connected"; } );
ds.Game.all().remove();

// Add a request Handler which calls the createPlayerAccount function in the playerAccount.js file
// when the /createPlayerAccount request is received
addHttpRequestHandler('/createPlayerAccount', 'scripts/playerAccount.js', 'createPlayerAccount');
addHttpRequestHandler('/loginPlayerAccount', 'scripts/playerAccount.js', 'loginPlayerAccount');
addHttpRequestHandler('/logoutPlayerAccount', 'scripts/playerAccount.js', 'logoutPlayerAccount');
addHttpRequestHandler('/forgotPassword', 'scripts/playerAccount.js', 'forgotPassword');
addHttpRequestHandler('/pingPlayerAccount', 'scripts/playerAccount.js', 'pingPlayerAccount');

// request handler for notification subscription
//addHttpRequestHandler('/notificationSubscribe', 'scripts/notification.js', 'notificationSubscribeRequest');

// Request handler for game related events
addHttpRequestHandler('/newRandomGame', 'scripts/game.js', 'newRandomGameRequest');

// set session timer 
new SharedWorker("sharedWorkers/updateLastSessionCheckTime.js", "UpdateLastSessionCheckTime");

// set notification sahred worker
var notificationServer ;
var nsWkr = new SharedWorker("sharedWorkers/notificationServer.js", "NotificationServer");