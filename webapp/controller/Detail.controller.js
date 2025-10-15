sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	"sap/ui/core/util/File",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	// Inicio remediação - (C3JOAOB) - Conversao Fiori Apps - (09.06.2025)
	"sap/m/Dialog",
	'sap/m/MessageItem',
	'sap/m/MessageView',
	'sap/m/MessageToast',
	'sap/m/Button',
	'sap/m/Bar',
	'sap/m/Title',
	"sap/ui/core/IconPool",
	"sap/ui/core/library",
	"sap/ui/core/BusyIndicator",
	// Fim remediação - (C3JOAOB) - Conversao Fiori Apps - (09.06.2025)	

], function (BaseController, JSONModel, formatter, mobileLibrary, File, MessageBox, Fragment, Dialog, MessageItem, MessageView, MessageToast, Button, Bar, Title, IconPool, coreLibrary, BusyIndicator) {
	"use strict";

	return BaseController.extend("cadastroequip_fornecedor_vpo.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data		

			this._aValidKeys = ["equip", "tech_info", "attachments", "internal", "equip_edit", "tech_info_edit", "documents_edit"];

			var oViewModel = new JSONModel({
				busy: false,
				delay: 1000,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
				// Set fixed currency on view model (as the OData service does not provide a currency).
				currency: "EUR",
				// the sum of all items of this order
				totalOrderAmount: 0,
				selectedTab: "",
				isEdit: false,
				attachmentsEdit: false,
				enableInternalInformation: null
			});

			oViewModel.setDefaultBindingMode("TwoWay");

			if (this.getOwnerComponent().getModel("detailView") == undefined) {
				this.getOwnerComponent().setModel(oViewModel, "detailView");
			}

			//semantic aggreations control
			this.oSemanticPage = this.byId("pageDetail");
			this.oEditAction = this.byId("editAction");

			this.isEdit = false;

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");
			this.getModel('detailView').getData().enableInternalInformation = this.getOwnerComponent().getModel('detailView').getData().enableInternalInformation;

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			// Inicio remediação - (C3JOAOB) - Conversao Fiori Apps - (09.06.2025)
			var TitleLevel = coreLibrary.TitleLevel;
			// Inicialização do modelo para as mensagens
			this._oMessageModel = new JSONModel();
			this._oMessageModel.setData([]); // Começa vazio
			var oMessageTemplate = new MessageItem({
				type: '{type}',
				title: '{title}',
				activeTitle: '{activeTitle}',
				description: '{description}',
				subtitle: '{subtitle}',
				counter: '{counter}'
			});
			this.oMessageView = new MessageView({
				showDetailsPageHeader: false,
				itemSelect: function () {
					oBackButton.setVisible(true);
				},
				items: {
					path: "/",
					template: oMessageTemplate
				},
				activeTitlePress: function () {
					MessageToast.show('Active title pressed');
				}
			});

			// Associa o modelo ao MessageView
			this.oMessageView.setModel(this._oMessageModel);
			let that = this
			// Criação do botão de voltar para o custom header (opcional, se tiver navegação no MessageView)
			var oBackButton = new Button({
				icon: IconPool.getIconURI("nav-back"),
				visible: false, // Inicia invisível
				press: function () {
					that.oMessageView.navigateBack();
					this.setVisible(false); // Esconde o botão ao voltar para a lista
				}
			});

			// Criação do Dialog que conterá o MessageView
			this.oDialog = new Dialog({
				resizable: true,
				content: this.oMessageView, // O MessageView é o conteúdo principal
				state: 'Error', // Pode setar um estado inicial
				beginButton: new Button({
					press: function () {
						this.getParent().close(); // Fecha o dialog
					},
					text: "Close"
				}),
				customHeader: new Bar({
					contentLeft: [oBackButton], // Botão de voltar
					contentMiddle: [
						new Title({
							text: "Error Messages", // Título inicial
							level: TitleLevel.H1
						})
					]
				}),
				contentHeight: "50%",
				contentWidth: "50%",
				verticalScrolling: false // Deixa o MessageView controlar o scroll
			});
			// Fim remediação - (C3JOAOB) - Conversao Fiori Apps - (09.06.2025)

			this.getOwnerComponent().getEventBus().subscribe("TechInfo", "Changed", this._onTechInfoChanged, this);
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {
			oEvent.getSource().setBusy(false);
		},


		onListUpdateStart: function (oEvent) {
			oEvent.getSource().setBusy(true);
		},
		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var oArguments = oEvent.getParameter("arguments");
			var oQuery = oArguments["?query"];

			this.getCompanyforUser(this.getOwnerComponent().getModel()).then((sValidationUser) => {
				if (sValidationUser == true) {
					this.getOwnerComponent().getModel('detailView').setProperty('/enableInternalInformation', true);
				} else if (sValidationUser == false) {
					this.getOwnerComponent().getModel('detailView').setProperty('/enableInternalInformation', false);

				} else {
					MessageBox.error(sValidationUser);
				}
			});

			this._sObjectId = oArguments.objectId;

			// Don't show two columns when in full screen mode
			if (this && this.getModel("appView").getProperty("/layout") !== "MidColumnFullScreen") {
				this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			} else if (!this) {
				return
			}

			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("E_EquipamentoSet", {
					Placa: this._sObjectId,
					EmailLogin: this.getUserEmailLogged()
				});
				this._bindView("/" + sObjectPath, this._sObjectId, oQuery.tab);
			}.bind(this));


			if (this.getModel('detailView').getProperty('/isEdit') == true && oQuery.tab !== "attachments") {
				oQuery.tab = oQuery.tab + "Edit";
			}

			if (oQuery && this._aValidKeys.indexOf(oQuery.tab) >= 0) {
				this.getView().getModel("detailView").setProperty("/selectedTab", oQuery.tab);
				this.getRouter().getTargets().display(oQuery.tab);
				let oOperadoraModel = new JSONModel({ E_OperadoraSet: [] });
				oOperadoraModel.setSizeLimit(10000);
				this.getView().setModel(oOperadoraModel, "operadoraView");
				this._operadorasBKP = { changed: false, data: [] };
				this.onLoadOperadoras();
				this.onLoadTpEquip();
			} else {
				this.getRouter().navTo("object", {
					objectId: this._sObjectId,
					query: {
						tab: "equip"
					}
				}, true);
			}
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath, sPlaca, sTab) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			//Filter Vinc Table				

			if (sPlaca && this.getView().byId('lineItemsList')) {
				let oItemsBiding = this.getView().byId('lineItemsList').getBinding('items');

				if (oItemsBiding.aFilters.length === 0 || oItemsBiding.aFilters[1].oValue1 != sPlaca) {
					let oUserFilter = new sap.ui.model.Filter("EmailLogin", sap.ui.model.FilterOperator.EQ, this.getUserEmailLogged()),
						oPlacaFilter = new sap.ui.model.Filter("Placa", sap.ui.model.FilterOperator.EQ, sPlaca);

					oItemsBiding.filter([oUserFilter, oPlacaFilter]);
				}
			}

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					}.bind(this),
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}.bind(this)
				}
			});

			// this.onLoadOperadoras();
		},

		onLoadOperadoras: async function (type) {
			BusyIndicator.show(0);

			return new Promise((resolve, reject) => {
				if (!this._sObjectId || this._sObjectId === "undefined" || this._sObjectId === "") {
					MessageToast.show(this.getResourceBundle().getText("erroConsultaNSPedagio"), {
						duration: 4000,
						animationTimingFunction: "ease",
						animationDuration: 800
					});
					BusyIndicator.hide();
					return reject("ObjectId inválido");
				}

				let placa = this._sObjectId;
				let oLocal = this.getView().getModel("operadoraView");
				let sPath = (type && type.sId === "press") ? "/E_OperadoraCPISet" : "/E_OperadoraSet";

				this.getModel().read(sPath, {
					filters: [new sap.ui.model.Filter("Placa", sap.ui.model.FilterOperator.EQ, placa)],
					success: (oData) => {
						let aOperadoras = oData.results.map(op => ({
							...op,
							Ativa: op.Ativa === "X",
							Utilizacao: op.Utilizacao === "X"
						}));

						oLocal.setProperty("/E_OperadoraSet", aOperadoras);
						oLocal.refresh(true);
						oLocal.updateBindings(true);

						if (type && type.sId === "press") {
							MessageToast.show(this.getResourceBundle().getText("succConsultaNSPedagio"));
						}

						BusyIndicator.hide();
						resolve(aOperadoras);
					},
					error: (error) => {

						// if (type && type.sId === "press") {
						// 	let aOperadoras = [
						// 		{
						// 			Placa: placa,
						// 			Operadora: "PEDAGIO SUL",
						// 			Ativa: false,
						// 			Utilizacao: false
						// 		},
						// 		{
						// 			Placa: placa,
						// 			Operadora: "PEDAGIO NORTE",
						// 			Ativa: true,
						// 			Utilizacao: true
						// 		}
						// 	];

						// 	oLocal.setProperty("/E_OperadoraSet", aOperadoras);
						// 	oLocal.refresh(true);
						// 	oLocal.updateBindings(true);

						// }

						console.log(JSON.parse(error.responseText).error.message.value);
						MessageToast.show(this.getResourceBundle().getText("erroConsultaNSPedagio"));
						BusyIndicator.hide();
						reject(error);
					}
				});
			});
		},


		// onLoadOperadoras: function (type) {
		// 	BusyIndicator.show(0);

		// 	if (!this._sObjectId || this._sObjectId === "undefined" || this._sObjectId === "") {
		// 		MessageToast.show(this.getResourceBundle().getText("erroConsultaNSPedagio"), {
		// 			duration: 4000, animationTimingFunction: "ease", animationDuration: 800
		// 		});
		// 		BusyIndicator.hide();
		// 		return;
		// 	}

		// 	let placa = this._sObjectId;
		// 	let oLocal = this.getView().getModel("operadoraView");
		// 	let sPath = (type && type.sId === "press") ? "/E_OperadoraCPISet" : "/E_OperadoraSet";

		// 	this.getModel().read(sPath, {
		// 		filters: [new sap.ui.model.Filter("Placa", sap.ui.model.FilterOperator.EQ, placa)],
		// 		success: (oData) => {

		// 			let aOperadoras = oData.results.map(op => ({
		// 				...op,
		// 				Ativa: op.Ativa === "X",
		// 				Utilizacao: op.Utilizacao === "X"
		// 			}));

		// 			oLocal.setProperty("/E_OperadoraSet", aOperadoras);
		// 			oLocal.refresh(true);
		// 			oLocal.updateBindings(true);

		// 			if (type && type.sId === "press") {
		// 				MessageToast.show(this.getResourceBundle().getText("succConsultaNSPedagio"));
		// 			}
		// 			BusyIndicator.hide();
		// 		},
		// 		error: (error) => {
		// 			console.log(JSON.parse(error.responseText).error.message.value);
		// 			MessageToast.show(this.getResourceBundle().getText("erroConsultaNSPedagio"));
		// 			BusyIndicator.hide();
		// 		}
		// 	});
		// },

		onLoadTpEquip: function () {

			let path = "/E_PedagioSet";
			let aTpEquip = [];
			let oModel = new sap.ui.model.json.JSONModel();

			const that = this;
			this.getModel().read(path, {
				success: function (oData) {
					aTpEquip = oData.results;
					oModel.setData({ E_PedagioSet: aTpEquip });
					that.getView().setModel(oModel, "pedagioSet");
					that.getView().getModel("pedagioSet").refresh(true);
				},
				error: function (error) {
					console.log(JSON.parse(error.responseText).error.message.value);
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			if (oView.getViewName().includes("Detail")) {
				//remove display views's and set editable view's
				const sTabKey = this.getView().byId("iconTabBar").getSelectedKey();
				let oItems = this.getView().byId("iconTabBar").getItems();

				for (let i in oItems) {
					if (oItems[i].getKey() === sTabKey) {

						this.getView().byId(oItems[i].getId()).removeAllContent();
						this.getOwnerComponent().oListSelector.clearMasterListSelection();


						if (this.getOwnerComponent().getModel("detailView").getProperty('/isEdit') == true) {
							this.getOwnerComponent().getModel("detailView").setProperty("/attachmentsEdit", true);

							// this.getView().byId(oItems[i].getId()).removeContent(0);
							if (sTabKey == 'attachments') {
								this.getRouter().getTargets().display(oItems[i].getKey(), oElementBinding.getPath());
								break
							}

							this.getRouter().getTargets().display(oItems[i].getKey() + "_edit", oElementBinding.getPath());
							break
						}

						// this.getView().byId(oItems[i].getId()).removeContent(0);
						this.getRouter().getTargets().display(oItems[i].getKey(), oElementBinding.getPath());
						break
					}
				}
			}
		},

		_onMetadataLoaded: function (oEvent, Teste) {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay;

			if (!oLineItemTable) {
				iOriginalLineItemTableBusyDelay = 1000;
			} else {

				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

				oLineItemTable.attachEventOnce("updateFinished", function () {
					// Restore original busy indicator delay for line item table
					oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
				});
			}


			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);



			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		onTabSelect: function (oEvent) {
			const sSelectedTab = oEvent.getParameter("selectedKey"),
				sPath = this.getView().getElementBinding().getPath();

			// this.getRouter().navTo("object", {
			// 	objectId: this._sObjectId,
			// 	query: {
			// 		tab: sSelectedTab
			// 	}
			// }, true);// true without history


			this._bindView(sPath, this._sObjectId, sSelectedTab)
		},
		_onHandleTelephonePress: function (oEvent) {
			var sNumber = oEvent.getSource().getText();
			URLHelper.triggerTel(sNumber);
		},


		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}

		},
		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onEditDetail: function () {
			const sPath = this.getView().getElementBinding().getPath();
			const sRestricao = this.getModel().getProperty(sPath).Restricao;
			const sEnableInternalInformation = this.getModel('detailView').getData().enableInternalInformation;

			// if (this.getModel().hasPendingChanges()) {
			// 	this.getModel().resetChanges();
			// 	this.getModel().refresh(true);
			// }

			if (sRestricao && !sEnableInternalInformation) {
				MessageBox.error('Registro com restrição');
				return
			}

			this.getModel("appView").setProperty("/actionButtonsInfo/isEdit", true);

			if (this.getView().byId('iconTabBar').getSelectedKey() == 'attachments') {
				let oUploadSet = this.getView().byId('iconTabFilterAttachments').getAggregation('content')[0].getAggregation('content')[0];

				oUploadSet.getToolbar().findElements()[4].setEnabled(true);
				oUploadSet.setUploadEnabled(true);
				oUploadSet.getItems().forEach((oItem) => {
					oItem.setEnabledRemove(true);
				});
			}

			let ativarConsulta = this._checkTpEquip(this.getView().getBindingContext().getObject().CodTpEquip);
			this.byId("btnConsultaNSPedagio").setEnabled(ativarConsulta === true);

			this.showFooterDetail(true);
			this.oEditAction.setVisible(false);
			this.getOwnerComponent().getModel("detailView").setProperty('/isEdit', true);
			this.isEdit = true;

			this.getOwnerComponent().getModel("detailView").setProperty('/attachmentsEdit', true);
			this._bindView(sPath);
		},

		onOperadoraAtivaChange: function (oEvent) {
			this.onOperadoraFieldChange(oEvent, 'Ativa');
			let ativaValue = oEvent.getSource().getSelected();
			let rbUtilizacao = this.getView().byId("rbUtilizacao");
			if (!ativaValue) {
				let iIndex = oEvent.getSource().getBindingContext("operadoraView").getPath().match(/\d+/)[0];
				let oModel = this.getView().getModel("operadoraView");
				let aOperadoras = oModel.getProperty("/E_OperadoraSet");
				if (aOperadoras && aOperadoras[iIndex]) {
					aOperadoras[iIndex].Utilizacao = false;
					oModel.setProperty("/E_OperadoraSet", aOperadoras);
				}
				rbUtilizacao.setSelected(false);
			}
		},

		onOperadoraUtilizacaoChange: function (oEvent) {
			// if (!oEvent.getParameter("userInteraction")) {
			// 	// ignorar disparo que veio do binding
			// 	return;
			// }
			this.onOperadoraFieldChange(oEvent, "Utilizacao");
		},

		onOperadoraFieldChange: function (oEvent, sField) {
			let sValue = oEvent.getSource().getSelected();
			let iIndex = oEvent.getSource().getBindingContext("operadoraView").getPath().match(/\d+/)[0];
			let oModel = this.getView().getModel("operadoraView");
			let aOperadoras = oModel.getProperty("/E_OperadoraSet");
			if (aOperadoras && aOperadoras[iIndex]) {
				aOperadoras[iIndex][sField] = sValue;
				oModel.setProperty("/E_OperadoraSet", aOperadoras);
			}
		},

		_deleteOperadorasByPlaca: function (placa) {
			return new Promise((resolve, reject) => {
				const sKeyPath = this.getModel().createKey("/E_OperadoraSet", {
					Placa: String(placa)
				});

				this.getModel().remove(sKeyPath, {
					success: resolve,
					error: function (oError) {
						let msg;
						try { msg = JSON.parse(oError.responseText).error.message.value; }
						catch (e) { msg = oError.message }
						reject(new Error(msg));
					}
				});
			});
		},

		_onSaveOperadora: async function () {
			let oModel = this.getView().getModel("operadoraView");
			let aOperadoras = oModel.getProperty("/E_OperadoraSet");
			let placa = this._sObjectId;
			let CodTpEquipPedagio = this.getView().getBindingContext().getObject().CodTpEquipPedagio

			if (CodTpEquipPedagio === 'X') {
				if (!Array.isArray(aOperadoras) || aOperadoras.length === 0) {
					return { type: "error", msg: "Operadoras Vale Pedágio sem dados." };
				}

				try {
					for (const operadora of aOperadoras) {
						const payload = {
							Placa: placa,
							Operadora: operadora.Operadora,
							Ativa: operadora.Ativa === true ? 'X' : '',
							Utilizacao: operadora.Utilizacao === true ? 'X' : ''
						};
						await new Promise((resolve, reject) => {
							this.getModel().create("/E_OperadoraSet", payload, {
								success: resolve,
								error: reject
							});
						});
					}
					return { type: "success", msg: this.getResourceBundle().getText("succSaveNSPedagioBE") };
				} catch (error) {
					return { type: "error", msg: `${this.getResourceBundle().getText("erroSaveNSPedagioBE")}: ${error.message}` };
				}
			} else {
				try {
					await this._deleteOperadorasByPlaca(placa);
					this.getModel().refresh(true);
					return { type: "info", msg: this.getResourceBundle().getText("succSaveNSPedagioBE2") };
				} catch (error) {
					return { type: "error", msg: `${this.getResourceBundle().getText("erroSaveNSPedagioBE")}: ${error.message}` };
				}
			}

		},

		_onlyNumbers: function (value) {
			if (typeof value !== "string") {
				return "";
			}
			return value.replace(/\D/g, "");
		},

		_validaRegistroANTT: function (registro, CodTpEquipPedagio) {
			let value = registro.getValue();
			if (CodTpEquipPedagio === 'X') {
				if (value && value !== "") {
					registro.setValueState("None");
					registro.setValueStateText("");
					return false;
				} else {
					registro.setValueState("Error");
					registro.setValueStateText("Registro ANTT é obrigatório.");
					return true;
				}
			} else {
				return false;
			}

		},

		onSaveDetail: async function () {
			BusyIndicator.show(0);
			this.getModel("appView").setProperty("/actionButtonsInfo/isEdit", false);
			let sPath = this.getView().getElementBinding().getPath();
			let oValues = this.getModel().getProperty(sPath);

			if (this.getView().byId('iconTabBar').getSelectedKey() == 'attachments') {
				let oUploadSet = this.getView().byId('iconTabFilterAttachments').getAggregation('content')[0].getAggregation('content')[0];

				oUploadSet.setUploadEnabled(false);
				oUploadSet.getItems().forEach((oItem) => {
					oItem.setEnabledRemove(false);
				});
			}

			const sExpLicenciamento = oValues.MmaaaaLicenciamento.replace(/\D/g, "");
			oValues.MmaaaaLicenciamento = sExpLicenciamento;
			oValues.EmailM = this.getUserEmailLogged();
			var haveError;

			haveError = this.validRequiredComboBoxs();


			let operadoraReturn = await this._onSaveOperadora();
			if (operadoraReturn.type === "error") {
				MessageBox.error(operadoraReturn.msg)
				haveError = true;
			}

			// if (this.getModel().hasPendingChanges() && !haveError) {
			if (!haveError) {
				oValues.RegistroANTT = this._onlyNumbers(oValues.RegistroANTT);
				await this._updateDriverData(sPath, oValues).then((oResponse) => {
					MessageBox.success("Dados atualizados com sucesso!", {
						onClose: function () {
							BusyIndicator.hide();
						}.bind(this)
					})
				}).catch((oError) => {
					let aMessages = []



					oError.forEach((oItem) => {
						// Remediação S4 - (C3JOAOB) - (09.06.2025) - Inicio.
						BusyIndicator.hide();
						// Remediação S4 - (C3JOAOB) - (09.06.2025) - Fim.  
						haveError = true;

						if (oItem.code === "ZVALIDATION/099") {
							let oTabItems = this.getView().byId("iconTabBar").getItems(),
								oEquipView = oTabItems[0].getContent()[0],
								oTechInfoView = oTabItems[1].getContent()[0];

							if (oEquipView !== undefined) {
								if (oEquipView.byId("input" + oItem.target)) {
									oEquipView.byId("input" + oItem.target).setValueState("Error").setValueStateText(oItem.message);
								} else
									if (oEquipView.byId("cb" + oItem.target)) {
										oEquipView.byId("cb" + oItem.target).setValueState("Error").setValueStateText(oItem.message);
									}
							}

							if (oTechInfoView !== undefined) {
								if (oTechInfoView.byId("input" + oItem.target) && oTabItems[1].getContent()) {
									oTechInfoView.byId("input" + oItem.target).setValueState("Error").setValueStateText(oItem.message);
								} else
									if (oTechInfoView.byId("cb" + oItem.target) && oTabItems[1].getContent()) {
										oTechInfoView.byId("cb" + oItem.target).setValueState("Error").setValueStateText(oItem.message);
									}
							}
							// Inicio remediação - (C3JOAOB) - Conversao Fiori Apps - (09.06.2025)
							aMessages.push({
								type: 'Error', // Tipo de mensagem
								title: oItem.message, // Título da mensagem 
								description: 'Field: ' + oItem.target,
								target: oItem.target //Target para conseguir ir ao ponto do erro
							});
							// Fim remediação - (C3JOAOB) - Conversao Fiori Apps - (09.06.2025)
						}

						if (oItem.code === "/IWBEP/CX_MGW_BUSI_EXCEPTION") {
							// Inicio remediação - (C3JOAOB) - Conversao Fiori Apps - (03.06.2025)
							aMessages.push({
								type: 'Error',
								title: "Erro geral do sistema",
								description: oItem.message
							});
							// MessageBox.error("Erro ao atualizar dados", {
							// 	onClose: function () {
							// 		BusyIndicator.hide();
							// 	}.bind(this)
							// });
						}
					});
					if (aMessages.length > 0) {
						this.onDisplayErrorMessages(aMessages);
					}
					// Fim remediação - (C3JOAOB) - Conversao Fiori Apps - (09.06.2025)
				});
			}

			if (haveError) {
				BusyIndicator.hide();
				return;
			}

			// this.onLoadOperadoras().then(() => {
			// 	this.byId("btnConsultaNSPedagio").setEnabled(false);
			// 	this.showFooterDetail(false);
			// 	this.oEditAction.setVisible(true);
			// 	this.isEdit = false;
			// 	this.getOwnerComponent().getModel("detailView").setProperty('/isEdit', false);
			// 	this.getOwnerComponent().getModel("detailView").setProperty('/attachmentsEdit', false);
			// 	this._bindView(sPath);
			// 	this.getModel().refresh();
			// 	MessageToast.alert("Dados atualizados com sucesso!");
			// 	BusyIndicator.hide();
			// });


			this.byId("btnConsultaNSPedagio").setEnabled(false);
			this.showFooterDetail(false);
			this.oEditAction.setVisible(true);
			this.isEdit = false;
			this.getOwnerComponent().getModel("detailView").setProperty('/isEdit', false);
			this.getOwnerComponent().getModel("detailView").setProperty('/attachmentsEdit', false);
			this._bindView(sPath);
			this.getModel().refresh();

			await this.onLoadOperadoras();
			this.getRouter().navTo("object", {
				objectId: this._sObjectId
			}, true)
			// MessageToast.show("Dados atualizados com sucesso!")
			BusyIndicator.hide();
		},
		// S4 Remediação - (C3JOAOB) - (09.06.2025) - Inicio    
		onDisplayErrorMessages: function (aMessages) {
			// Limpa o modelo atual e adiciona as novas mensagens
			this._oMessageModel.setData(aMessages);
			// Abre o dialog
			if (this.oDialog.isOpen()) {
				this.oMessageView.navigateBack(); // Volta para a lista se já estava aberto e mostrando detalhes
			} else {
				this.oDialog.open();
			}
		},
		// S4 Remediação - (C3JOAOB) - (09.06.2025) - Fim   
		onCancelDetail: async function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/isEdit", false);
			const sPath = this.getView().getElementBinding().getPath();
			if (this.getView().byId('iconTabBar').getSelectedKey() == 'attachments') {
				let oUploadSet = this.getView().byId('iconTabFilterAttachments').getAggregation('content')[0].getAggregation('content')[0];

				oUploadSet.setUploadEnabled(false);
				oUploadSet.getItems().forEach((oItem) => {
					oItem.setEnabledRemove(false);
				});
			}
			if (this.getModel().hasPendingChanges()) {
				this.getModel().resetChanges();
				this.getModel().refresh(true);
			}

			this.byId("btnConsultaNSPedagio").setEnabled(false);

			if (this._operadorasBKP && this._operadorasBKP.changed === true) {
				this._operadorasBKP.data = [];
				this._operadorasBKP.changed = false;
			}

			this.showFooterDetail(false);
			this.oEditAction.setVisible(true);
			this.isEdit = false;
			this.getOwnerComponent().getModel("detailView").setProperty('/isEdit', false);
			this.getOwnerComponent().getModel("detailView").setProperty('/attachmentsEdit', false);
			this._bindView(sPath);
			await this.onLoadOperadoras();
		},

		showFooterDetail: function (bShow) {
			this.oSemanticPage.setShowFooter(bShow);
		},

		_updateDriverData: function (sPath, oValues) {
			return new Promise((resolve, reject) => {
				this.getModel().update(sPath, oValues, {
					success: function (oData, oResponse) {
						if (oResponse.statusCode === "204") {
							resolve(oResponse);
						} else {
							reject(oError)
						}


					},

					error: function (oError) {
						let oErrorDetails = JSON.parse(oError.responseText).error.innererror.errordetails;
						reject(oErrorDetails);
					}
				});
			})
		},

		handleChange: async function (oEvent) {
			oEvent.getSource().setValueState('None');
		},



		validationField: function (aParameters) {
			return new Promise((resolve, reject) => {
				this.getModel().callFunction("/validationFunction", {
					method: "GET",
					urlParameters: aParameters,
					success: function (oData) {
						resolve(oData)
					},
					error: function (oError, oResponse) {
						reject(oError)
					}
				}
				)
			})
		},

		handleDateChange: function (oEvent) {
			let oDateField = oEvent.getSource();
			const sValue = oDateField.getBinding('value').getValue(),
				sToday = new Date()

			oDateField.setValueStateText('');
			oDateField.setValueState('None');

			switch (true) {
				case oEvent.getSource().getId().includes('AnoFab'):
					this.getModel().setProperty(this.getView().getBindingContext().getPath() + '/AnoFab', oEvent.getSource().getValue());
					this.getModel().setProperty(this.getView().getBindingContext().getPath() + '/AnoFabDate', sValue);
					break;
				case oEvent.getSource().getId().includes('MmaaaaLicenciamento'):
					const sMonthLicenciamento = new Date();

					if (sValue <= sMonthLicenciamento.getMonth()) {
						oDateField.setValueState('Error');
						oDateField.setValueStateText('AET Expirada');
						break;
					}
					this.getModel().setProperty(this.getView().getBindingContext().getPath() + '/MmaaaaLicenciamento', oEvent.getSource().getValue());
					this.getModel().setProperty(this.getView().getBindingContext().getPath() + '/MmaaaaLicenciamentoDate', sValue);
					break;

				default:
				// if (sValue >= sToday) {
				// 	oDateField.setValueState('Error');
				// 	oDateField.setValueStateText('Data, não pode ser maior ou igual a data de hoje');
				// 	break
				// }
			}



		},

		onUploadSelectedButton: function (oEvent) {
			let oUploadSet = this.byId("attachmentUpl");

			oUploadSet.getItems().forEach(function (oItem) {
				if (oItem.getListItem().getSelected()) {
					oUploadSet.uploadItem(oItem);
				}
			});
		},

		handleUploadComplete: function (oEvent) {
			if (oEvent.getParameter('status') == 400) {

				const xmlString = oEvent.getParameter('response');
				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(xmlString, "application/xml");

				// Especificando o namespace do XML
				const namespace = "http://schemas.microsoft.com/ado/2007/08/dataservices/metadata";

				// Obtendo o conteúdo da primeira tag <message>
				const messageTag = xmlDoc.getElementsByTagNameNS(namespace, "message")[0];
				const messageContent = messageTag ? messageTag.textContent : "Erro tecnico, favor entrar em contato com o Administrador da Aplicação";

				MessageBox.error(messageContent)
			}

			this.getModel().refresh(true);
			oEvent.getSource().setBusy(false);
		},

		onAfterItemAdded: async function (oEvent) {
			const placa = this.getModel().getProperty(this.getView().getParent().getBindingContext().getPath()).Placa;

			let oItem = oEvent.getParameter('item'),
				oUploadSet = oEvent.getSource();


			return await this.displayCategoryDialog(oItem, oUploadSet);
		},

		onBeforeItemRemove: function (oEvent) {
			oEvent.getParameter('item').getStatuses().forEach((oItem) => {
				if (oEvent.getParameter('item').getStatuses()[2].getProperty('title') === 'ID') {
					this.deleteAttachmentId = oEvent.getParameter('item').getStatuses()[2].getProperty('text');
				}
			})
		},

		onRemoveAttachmentPress: async function (oEvent) {
			const placa = this.getModel().getProperty(this.getView().getParent().getBindingContext().getPath()).Placa;
			const fileID = this.deleteAttachmentId;

			let oUploadSet = this.getView().byId('attachmentUpl');

			this.getModel().setHeaders({
				"x-csrf-token": "Fetch"
			});

			oUploadSet.setBusy(true);

			await this.getModel().remove(`/E_AnexosSet(DocId='${fileID}',IdRep='${placa}')/$value`, {
				success: async function (oData) {
					oUploadSet.setBusy(false);
					this.getModel().refresh();
				}.bind(this),
				error: function (oError) {
					JSON.parse(oError.responseText).error.message.value
					oUploadSet.setBusy(false)
				}
			})
		},

		onDownloadSelectedButton: function (oEvent) {
			let oUploadSet = this.byId("attachmentUpl"),
				selectedFile = oUploadSet.getSelectedItem()[0];


			// Endpoint do arquivo binário
			const sPath = `${selectedFile.getBindingContext()}/$value`;

			// A chamada será feita diretamente via XMLHttpRequest para tratar o binário
			var oRequest = new XMLHttpRequest();
			oRequest.open("GET", this.getModel().sServiceUrl + sPath, true);
			oRequest.setRequestHeader("Accept", "application/octet-stream"); // Ou outro MIME Type adequado
			oRequest.responseType = "blob"; // Define a resposta como binário (blob)

			// Tratar a resposta da requisição
			oRequest.onload = function () {
				if (oRequest.status === 200) {
					// Obtendo os dados da view
					var oUploadSet = this.byId("attachmentUpl");

					// Criar um Blob para o arquivo
					var oBlob = oRequest.response;

					var MimeType = oRequest.getResponseHeader("Content-Type"),
						extension = "";

					//Atribuindo Extension baseado no MimeType ( Adicionar mais, caso necessário )
					switch (MimeType) {
						case "application/pdf":
							extension = ".pdf";
							break;
						case "image/jpeg":
							extension = ".jpg";
							break;
						case "image/png":
							extension = ".png";
							break;
						case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
							extension = ".xlsx";
							break;
						case "plain/text":
							extension = ".txt";
							break;
						case "application/msword":
							extension = ".doc";
							break;
						case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
							extension = ".docx";
							break;
						// Adicione outros tipos MIME conforme necessário
						default:
							extension = ".bin"; // Extensão genérica para binário
					}

					// Criar o link de download
					var oLink = document.createElement("a");
					oLink.href = window.URL.createObjectURL(oBlob);
					oLink.download = "" + oUploadSet.getSelectedItem()[0].getFileName() + extension;//"file.ext"; // Nome do arquivo a ser baixado
					oLink.click(); // Dispara o download
				} else {
					this._handleError(oRequest);
				}
			}.bind(this);

			// Caso ocorra erro
			oRequest.onerror = function () {
				sap.m.MessageToast.show("Erro na requisição do arquivo.");
			};

			// Enviar a requisição
			oRequest.send();
		},
		// Função para tratar os erros do Gateway
		_handleError: function (oRequest) {
			var sErrorMessage = "Erro ao fazer o download do arquivo.";
			// var contentType = oRequest.getResponseHeader("Content-Type");

			// contentType = "application/json";

			var fileReader = new FileReader();
			fileReader.onload = function () {
				var oParser = new DOMParser();
				var oDoc = oParser.parseFromString(fileReader.result, "application/xml");
				var sMessageNode = oDoc.getElementsByTagName("message")[0];
				if (sMessageNode) {
					sErrorMessage = sMessageNode.textContent;
				}
				MessageBox.error(sErrorMessage);
			};
			fileReader.readAsText(oRequest.response); // Lê o conteúdo binário como texto XML
		},

		onAfterRederingAttachments: async function (oEvent) {
			let oUploadSet = oEvent.getSource().byId('attachmentUpl');
			const sServicePath = "sap/opu/odata/sap/ZGTWPM095_EQUIPAMENTO_V2_SRV/E_AnexosSet";

			if (this.getOwnerComponent().getModel("detailView").getProperty("/isEdit")) {
				this.getModel("detailView").setProperty('/attachmentsEdit', true);
			} else {
				this.getModel("detailView").setProperty('/attachmentsEdit', false)
			}
			//if Open Application from WorkZone BTP, set BTP Url on Service 
			if (this.getOwnerComponent()._componentConfig != undefined) {
				const sBtpUrlPath = this.getOwnerComponent()._componentConfig.url;

				if (sBtpUrlPath && sBtpUrlPath.length > 1) {
					oUploadSet.setUploadUrl(sBtpUrlPath + sServicePath);
				}

			} else if (this.getOwnerComponent()._oManifest != undefined) {
				const sBtpUrHTML5lPath = this.getOwnerComponent()._oManifest._oBaseUri._string;

				if (this.getOwnerComponent()._oManifest._oBaseUri._string.length > 1) {
					oUploadSet.setUploadUrl(sBtpUrHTML5lPath + sServicePath);
				}
			}
		},
		onLoadCity: function (oEvent) {
			if (oEvent.getSource().getBindingContext()) {
				const sKey = this.getModel().getProperty(oEvent.getSource().getBindingContext().getPath() + "/UfPlaca");
				const oFilter = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, sKey);

				this.byId('cbCidadeVeiculo').bindItems({
					path: "/SH_CidadesSet",
					filters: [oFilter],
					length: 5000,
					template: new sap.ui.core.Item({
						key: "{Taxjurcode}",
						text: "{Text}"
					})
				});
			}

		},


		_onTechInfoChanged: function (sChannel, sEvent, oData) {
			let bCheck = this._checkTpEquip(oData.value);
			let oButton = this.byId("btnConsultaNSPedagio");
			if (oButton) { oButton.setEnabled(bCheck); }

			let oCtx = this.getView().getBindingContext();
			if (oCtx) {
				let sPathCtx = oCtx.getPath();
				this.getView().getModel().setProperty(`${sPathCtx}/CodTpEquipPedagio`, bCheck ? "X" : "");
			}

			if (bCheck === false) this._clearANTT();

			let oLocal = this.getView().getModel("operadoraView");
			if (!bCheck) {
				if (this._operadorasBKP && this._operadorasBKP.changed === false) {
					this._operadorasBKP.changed = true;
					this._operadorasBKP.data = oLocal.getData().E_OperadoraSet;
				}
				oLocal.setProperty("/E_OperadoraSet", []);
				oLocal.refresh(true);
				oLocal.updateBindings(true);
			} else {
				if (this._operadorasBKP && this._operadorasBKP.changed === true) {
					oLocal.setProperty("/E_OperadoraSet", this._operadorasBKP.data);
					oLocal.refresh(true);
					oLocal.updateBindings(true);
				}
			}
		},

		_clearANTT: function () {
			let oModel = this.getView().getModel();
			let oCtx = this.getView().getBindingContext();
			if (oCtx) {
				let sPath = oCtx.getPath();
				oModel.setProperty(`${sPath}/RegistroANTT`, "");
			}
		},
		// formatEnableEquip: function (bEnableInternalInfo, sCodTpEquip) {
		// 	bEnableInternalInfo === null ? bEnableInternalInfo = true : bEnableInternalInfo = bEnableInternalInfo;
		// 	return bEnableInternalInfo && sCodTpEquip === "X";
		// },

		formatANTT: function (sValue) {
			if (!sValue) {
				return "";
			}

			let sOnlyNumbers = sValue.replace(/\D/g, "");
			let sFormatted;

			if (sOnlyNumbers.length <= 11) {
				// CPF
				sFormatted = sOnlyNumbers
					.replace(/(\d{3})(\d)/, "$1.$2")
					.replace(/(\d{3})(\d)/, "$1.$2")
					.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
			} else {
				// CNPJ
				sFormatted = sOnlyNumbers
					.replace(/^(\d{2})(\d)/, "$1.$2")
					.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
					.replace(/\.(\d{3})(\d)/, ".$1/$2")
					.replace(/(\d{4})(\d)/, "$1-$2");
			}

			return sFormatted;
		},

		handleChangeAntt: function (oEvent) {
			let registro = this.getView().byId("SimpleFormEquipEdit").getContent()[50];
			let value = registro.getValue()
			let oInput = oEvent.getSource();
			let sPath = oInput.getBinding("value").getPath();
			let oCtx = oInput.getBindingContext();
			let oModel = oInput.getModel(oCtx.getModel().sName);

			let sValue = value.replace(/\D/g, "");

			if (!sValue) {
				// oInput.setValue("");
				registro.setValue("");
				oModel.setProperty(sPath, "", oCtx);
				return;
			}

			if (value && value !== "") {
				registro.setValueState("None");
				registro.setValueStateText("");
			}

			let sFormatted = this.formatANTT(sValue);
			// oInput.setValue(sFormatted);
			registro.setValue(sFormatted);
			oModel.setProperty(sPath, sValue, oCtx);
		},


		_checkTpEquip: function (id) {
			let aTpEquip = this.getView().getModel("pedagioSet").getData().E_PedagioSet;
			let oFound = aTpEquip.find(item => item.Id === id);
			let enableControl = (oFound && oFound !== undefined && oFound.ativarConsulta === 'X') ? true : false;
			return enableControl;
		},

		onComboBoxChange: function (oEvent) {
			const sKey = oEvent.getParameter('selectedItem').getKey();
			const sText = oEvent.getParameter('selectedItem').getText();

			oEvent.getSource().setValueState('None');
			oEvent.getSource().setValueStateText('');

			switch (true) {
				case oEvent.getSource().getId().includes("cbUfPlaca"):
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/UfPlaca", sKey);
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/UfPlacaText", sText);

					const oFilter = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, sKey);
					this.byId('cbCidadeVeiculo').bindItems({
						path: "/SH_CidadesSet",
						filters: [oFilter],
						length: 5000,
						template: new sap.ui.core.Item({
							key: "{Taxjurcode}",
							text: "{Text}"
						})
					});
					break;
				case oEvent.getSource().getId().includes("cbCidadeVeiculo"):
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/CidadeVeiculo", sKey.substring(0, 2));
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/CidadeVeiculoText", sText);
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/DomicCode", sKey);
					break;
				case oEvent.getSource().getId().includes("cbCodTpEquip"):
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/CodTpEquip", sKey);
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/CodTpEquipText", sText);
					this.getOwnerComponent().getEventBus().publish("TechInfo", "Changed", { value: sKey });
					break;
				case oEvent.getSource().getId().includes("cbTpObjTec"):
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/TpObjTec", sKey);
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/TpObjTecText", sText)
					break;
				case oEvent.getSource().getId().includes("cbMarca"):
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/Marca", sKey);
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/MarcaText", sText);
					break;
				case oEvent.getSource().getId().includes("cbCorVeiculo"):
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/CorVeiculo", sKey);
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/CorVeiculoText", sText);
					break;
				case oEvent.getSource().getId().includes("cbUfPlaca"):
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/UfPlaca", sKey);
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/UfPlacaText", sText);
					break;
				case oEvent.getSource().getId().includes("cbTpTransporte"):
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/TpTransporte", sKey);
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/TpTransporteText", sText);
					break;
				case oEvent.getSource().getId().includes("cbTipoRastreador"):
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/TipoRastreador", sKey);
					this.getModel().setProperty(oEvent.getSource().getBindingContext().getPath() + "/TipoRastreadorText", sText);
					break;
			}
		},

		onPressDesvincular: async function (oEvent) {
			let sPath = this.getView().byId("lineItemsList").getSelectedContextPaths()[0];

			if (!sPath) {
				MessageBox.error('Selecionar linha para desvinculo');
				return;
			}

			BusyIndicator.show(0);

			await this.removeVinculo(sPath).then((oResponse) => {
				this.getModel().refresh();
				this.oSemanticPage.getCloseAction().firePress();
				BusyIndicator.hide();
				MessageBox.success('Transportadora desvinculada com Sucesso!');
			}).catch((oError) => {
				BusyIndicator.hide();
				this.getModel().refresh();
				this.oSemanticPage.getCloseAction().firePress();
				let message = JSON.parse(oError.responseText).error.message.value;
				MessageBox.error(message);
			})
		},

		createVinculo: function (oMasterContext) {
			return new Promise((resolve, reject) => {
				this.getModel().submitChanges({
					success: function (oResponse, oError) {
						if (oResponse.__batchResponses[0].response.statusCode === "201") {
							resolve(oResponse);
						} else {
							reject(oError)
						}


					},

					error: function (oError) {
						this.getModel().resetChanges();
						reject(oError)
					}
				});
			})
		},

		removeVinculo: function (sPath) {
			return new Promise((resolve, reject) => {
				this.getModel().remove(sPath, {
					success: function (oData, oResponse) {
						if (oResponse.statusCode === "204") {
							resolve(oResponse);
						} else {
							reject(oError)
						}
					},

					error: function (oError) {
						reject(JSON.parse(oError.responseText).error.message.value)
					}
				});
			})
		},

		getAttchments: function (oFilter) {
			return new Promise((resolve, reject) => {
				this.getModel().read('/E_AnexosSet', {
					filters: [oFilter],
					success: function (oData) {
						resolve(oData)
					},

					error: function (oError, oResponse) {
						reject(oError)
					}
				})
			})
		},

		getCompanyforUser: async function (oModel) {
			var aParameters = { EmailLogin: this.getUserEmailLogged() };

			return await this.callCompanyFucntion(oModel, aParameters).then((oData) => {
				if (oData.validationUser.IsEldorado == true) {
					return true
				} else {
					return false
				}
			}
			).catch((oError) => {
				// Inicio remediação - (C3JOAOB) - Conversao Fiori Apps - (09.06.2025)      
				BusyIndicator.hide();
				JSON.parse(oError.responseText).error.message.value
			});
			// Fim remediação - (C3JOAOB) - Conversao Fiori Apps - (09.06.2025)  
		},

		callCompanyFucntion: async function (oModel, aParameters) {
			return new Promise((resolve, reject) => {
				oModel.callFunction("/validationUser", {
					method: "GET",
					urlParameters: aParameters,
					success: function (oData) {
						resolve(oData)
					},
					error: function (oError, oResponse) {
						reject(oError)
					}
				})
			});
		},

		displayCategoryDialog: async function (oItem, oUploadSet) {
			if (!this._pViewSettingsDialog) {
				this._pViewSettingsDialog = Fragment.load({
					id: this.getView().getId(),
					name: "cadastroequip_fornecedor_vpo.view.FileCategory",
					controller: this
				}).then(function (oDialog) {
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					return oDialog;
				}.bind(this));
			}

			this._pViewSettingsDialog.then(function (oDialog) {
				oDialog.selectedFile = oItem;
				oDialog.oUploadSet = oUploadSet;
				oDialog.open();
			});
		},

		onConfirmCategory: function (oEvent) {
			let oUploadSet = this.getView().getDependents()[0].oUploadSet,
				oSelectedFile = this.getView().getDependents()[0].selectedFile;

			const sFileCategory = this.getView().byId('cbCategArquivo').getSelectedKey();
			const placa = this.getModel().getProperty(this.getView().getParent().getBindingContext().getPath()).Placa;
			const sFileName = oSelectedFile.getFileName();
			oUploadSet.setBusy(true);

			let oXCSRFToken = new sap.ui.core.Item({
				key: "x-csrf-token",
				text: this.getOwnerComponent().getModel().getSecurityToken()
			});

			let oSlug = new sap.ui.core.Item({
				key: "SLUG",
				text: sFileName
			});

			let oCpf = new sap.ui.core.Item({
				key: "IdRep",
				text: placa
			});

			let oFileCategory = new sap.ui.core.Item({
				key: "fileCat",
				text: sFileCategory
			});

			oUploadSet.removeAllHeaderFields();
			oUploadSet.addHeaderField(oXCSRFToken).addHeaderField(oSlug).addHeaderField(oCpf).addHeaderField(oFileCategory).uploadItem(oSelectedFile);
			this.getView().getDependents()[0].close();
		},

		onCloseDialogCategory: function (oEvent) {
			//Remove o anexo incompleto, cancelado pelo usuário
			this.getView().getContent()[0].getIncompleteItems()[0].destroy();
			oEvent.getSource().getParent().close();
		},

		removeErrorState: function (oEvent) {
			oEvent.getSource().setValueState('None');
		},

		validRequiredComboBoxs: function (oEvent) {
			let oTabItems = this.getView().byId("iconTabBar").getItems(),
				oEquipView = oTabItems[0].getContent()[0],
				oTechInfoView = oTabItems[1].getContent()[0],
				haveError;

			if (oEquipView) {
				if (oEquipView.byId('SimpleFormEquipEdit')) {
					oEquipView.byId('SimpleFormEquipEdit').getContent().forEach((oItem) => {
						if (oItem.isA('sap.m.ComboBox') && oItem.getProperty('required') && oItem.getValue() === '') {
							oItem.setValueState('Error');

							haveError = true;
						}
					});
				}

			}


			if (oTechInfoView) {
				if (oTechInfoView.byId('SimpleFormDocumentsDriverInfoEdit')) {
					oTechInfoView.byId('SimpleFormDocumentsDriverInfoEdit').getContent().forEach((oItem) => {
						if (oItem.isA('sap.m.ComboBox') && oItem.getProperty('required') && oItem.getValue() === '') {
							oItem.setValueState('Error');

							haveError = true;
						}
					});
				}

			}

			let CodTpEquipPedagio = this.getView().getBindingContext().getObject().CodTpEquipPedagio

			let registro = oEquipView.byId("SimpleFormEquipEdit").getContent()[50];
			haveError = this._validaRegistroANTT(registro, CodTpEquipPedagio);

			if (haveError) {
				MessageBox.error("Erro ao atualizar dados", {
					onClose: function () {
						BusyIndicator.hide();
					}.bind(this)
				});

				return true;
			}
		}
	});
});