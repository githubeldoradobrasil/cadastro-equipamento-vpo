sap.ui.define([
	"sap/ui/model/type/Currency"
], function (Currency) {
	"use strict";

	return {
		cpfMask: function (sCpfNumber) { 
			// if (sCpf !== null || sCpf.length == 11) {
				
			if (sCpfNumber !== null ) {
				sCpfNumber=sCpfNumber.replace(/\D/g,"")
				sCpfNumber=sCpfNumber.replace(/(\d{3})(\d)/,"$1.$2")
				sCpfNumber=sCpfNumber.replace(/(\d{3})(\d)/,"$1.$2")
				sCpfNumber=sCpfNumber.replace(/(\d{3})(\d{1,2})$/,"$1-$2")
			   return sCpfNumber
			}

			// }

			// return this.getResourceBundle().getText("noCpf");
		},

		rgMask: function (sRgNumber) {
			if (sRgNumber !== null) {
				sRgNumber=sRgNumber.replace(/\D/g,"")
				sRgNumber=sRgNumber.replace(/(\d{2})(\d)/,"$1.$2")
				sRgNumber=sRgNumber.replace(/(\d{3})(\d)/,"$1.$2")
				sRgNumber=sRgNumber.replace(/(\d{3})(\d{1,2})$/,"$1-$2")
			   return sRgNumber
			}
		},
		generoMask: function (sGenero) {
			let sGeneroString;
			
			switch (sGenero) {
				case "M":
					sGeneroString = "Masculino"
					break;
				case "F":
					sGeneroString = "Feminino"
					break;
				default:
					sGeneroString = ""
			}

			return sGeneroString;
		},

		telMask: function (sTel) {
			if (sTel && sTel !== null) {
				sTel=sTel.replace(/\D/g,"")
				sTel=sTel.replace(/(\d{2})(\d)/,"$1 $2")
				sTel=sTel.replace(/(\d{4})(\d)/,"$1-$2")
			   return sTel
			}
		},

		formatThumbnailUrl: function (mediaType) {
			var iconUrl;
			switch (mediaType) {
				case "image/png":
					iconUrl = "sap-icon://card";
					break;
				case "text/plain":
					iconUrl = "sap-icon://document-text";
					break;
				case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
					iconUrl = "sap-icon://excel-attachment";
					break;
				case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
					iconUrl = "sap-icon://doc-attachment";
					break;
				case "application/pdf":
					iconUrl = "sap-icon://pdf-attachment";
					break;
				default:
					iconUrl = "sap-icon://attachment";
			}
			return iconUrl;
		},

		isLicenciado: function (sIsLicenciado) {	
			let isLicenciado;
			switch (sIsLicenciado){
				case true:
					isLicenciado = 'Sim';
					break;
				case false:
					isLicenciado = 'Não'
					break;
				default:
				''	
			}
			return isLicenciado; 
		},

		timeMask: function (sTime) {
			if (sTime !== null ) {
				let dateAndHour = new Date(sTime.ms),
				hours = dateAndHour.getHours(),
				minutes = dateAndHour.getMinutes(),
				seconds = dateAndHour.getSeconds();
				
				if (hours.toString().length < 2) {
					hours = '0' + hours;
				}

				if (minutes.toString().length < 2) {
					minutes = '0' + minutes;
				}

				if (seconds.toString().length < 2) {
					seconds = '0' + seconds;
				}


				return hours + ':' + minutes + ':' + seconds;
			};
		},

		anoFabMask: function (sAnoFab) { 
			// if (sCpf !== null || sCpf.length == 11) {
				
			if (sAnoFab !== null ) {
				sAnoFab=sAnoFab.replace(/\D/g,"");
				sAnoFab=sAnoFab.replace(/(\d{2})(\d)/,"$1/$2");
			   return sAnoFab
			}

			// }

			// return this.getResourceBundle().getText("noCpf");
		}
	};
});