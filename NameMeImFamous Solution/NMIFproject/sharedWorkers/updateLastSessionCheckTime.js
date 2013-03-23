/**

* @author admin

*/

function _lastSessionCheckTime() {
	// decrease the lastSessionCheckTime 	
/*	ds.PlayerAccount.query("lastSessionCheckTime > 0 and status = 'connected'").forEach(function(p) {
		p.lastSessionCheckTime = p.lastSessionCheckTime - 1;
	});

	
	// time out players whose lastSessionCheckTime has expired
	ds.PlayerAccount.query("lastSessionCheckTime = 0 and status = 'connected'").forEach(function(p) {
		p.status = "timeout";
	});
	*/
}

console.log("Start of the session check SharedWorker");
//setInterval(_lastSessionCheckTime, 1000);
