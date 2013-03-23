/**

* @author admin

*/
function chLogin(userName, password)
{
	var thePlayer = ds.Player({name=userName});
	var theGroups = ['Admin'];
	if (thePlayer == null) {
		return false;
	} else {
		if (password == thePlayer.password) { 
			return { 
				ID:thePlayer.ID,
				name:thePlayer.name,
				fullName:thePlayer.fullName,
				belongsTo:theGroups};
			}
		} else {
			return { error:1024,errorMessage:"invalid login"};
		}
	}
}