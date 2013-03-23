/**

* @author jino

*/

function buildJSONRetFromError(error)
{
	var ret = '{"success":"0", "error":"' + error.code + '", "errorMessage":"' + error.message + '"}';
	return ret;
}