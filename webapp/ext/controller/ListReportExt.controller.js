sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
  ],
  function (Controller, MessageToast, MessageBox, Fragment) {
    "use strict";
    return {
      print: async function (oEvent) {
        var lv_close;
        if (!this.busyDialog) {
          Fragment.load({
            id: "busyFragment",
            name: "zporeport.ext.controller.fragment.busy",
            type: "XML",
            controller: this,
          })
            .then((oDialog) => {
              this.busyDialog = oDialog;
              this.busyDialog.open();
              lv_close = oDialog;
            })
            .catch((error) => {
              MessageBox.error("Vui lòng tải lại trang");
            });
        } else {
          this.busyDialog.open();
          lv_close = this.busyDialog;
        }

        let aContexts = this.extensionAPI.getSelectedContexts();
        let listOfPromisesHead = [];
        let listOfPromisesItem = [];
        aContexts.forEach((element) => {
          let oModel = element.getModel();

          listOfPromisesHead.push(
            new Promise((resolve, reject) => {
              oModel.read(element.getPath(), {
                success: function (oDataRoot, oResponse) {
                  resolve(oDataRoot);
                },
                error: function (error) {
                  reject(error);
                },
              });
            })
          );

          listOfPromisesItem.push(
            new Promise((resolve, reject) => {
              oModel.read(`${element.getPath()}/to_Item`, {
                success: function (oDataRoot, oResponse) {
                  resolve(oDataRoot);
                },
                error: function (error) {
                  reject(error);
                },
              });
            })
          );
        });

        let _countDoc = 0;
        Promise.all(listOfPromisesHead).then((resultHeader) => {
          Promise.all(listOfPromisesItem).then((resultItem) => {
            let _xmlArr = [];
            let _xmlStr = "";
            let _xmlItm = "";
            let _count = 0;
            let _date = "";
            let _ngay = "Ngày";
            let _thang = "tháng";
            let _nam = "năm";
            let _sum = "";
            let _sumqty = "";
            resultHeader.forEach((_header) => {
              
              let _text1 = "Tel:";
              let _text2 = "Fax:";
              let _tel = _text1.concat(
                " ",
                _header.Tel_Comp,
                " ",
                _text2,
                " ",
                _header.Fax_Comp
              );
              _xmlItm = "";
              _xmlStr = "";
              let _sumqty = 0;
              let _sum = 0;
              resultItem[_countDoc].results.forEach((_item) => {
                _count = _count + 1;
                let price = parseFloat(_item.NetPriceAmount);
                _sum += price;
                let orderqty = parseFloat(_item.OrderQuantity);
                _sumqty += orderqty;
                var _noitem = _item.PurchaseOrderItem / 10;
                var amount_curr = _item.NetPriceAmount;
                amount_curr = new Intl.NumberFormat("en-DE").format(
                  amount_curr
                );
                console.log(amount_curr);
                _xmlItm = `${_xmlItm}<Row2>
                <No>${_noitem}</No>
                <PartNo>${_item.Material}</PartNo>
                <Product>${_item.PurchaseOrderItemText}</Product>
                <Unit>${_item.PurchaseOrderQuantityUnit}</Unit>
                <Qty>${_item.OrderQuantity}</Qty>
                <UnitPrice>${_item.DocumentCurrency}</UnitPrice>
                <Tax>${amount_curr}</Tax>
             </Row2>`;
              });
              _sum = new Intl.NumberFormat("en-DE").format(_sum);
              _countDoc = _countDoc + 1;
              var _term_out = ""
              var _time_out = "" 
              var _checkout = 0
              var _term_in  = ""
              var _date_in  = ""
              var _checkin  = 0
              if(_header.PurchaseOrderType == 'ZNB2'){
                _checkin = 1
                _term_in = _header.Term
                _date_in = _header.ScheduleLineDeliverydate
                _header.YY1_PortofDischarge_PDH = ""
                _header.YY1_PortofLoading_PDH = ""
              }else{
                _checkout = 1
                _term_out = _header.Term
                _time_out = _header.ScheduleLineDeliveryTime
              }
              _xmlStr = `<?xml version="1.0" encoding="UTF-8"?>
              <form1>
                 <Subform1/>
                 <Subform2>
                    <Add>${_header.Add_Comp}</Add>
                    <Tel>${_tel}</Tel>
                    <MST>${_header.MST}</MST>
                    <No>${_header.PurchaseOrder}</No>
                    <Subform11>
                       <Dear>Cong ty TNHH ABC</Dear>
                       <Add1>${_header.Add_Sup}</Add1>
                       <Date>${_header.CreationDate}</Date> 
                       <Fax1>${_header.Fax_Sup}</Fax1>
                       <Tel1>${_header.Tel_Sup}</Tel1>
                    </Subform11>
                 </Subform2>
                 <Subform3>
                    <Table1>
                       <Row1/>
                        ${_xmlItm}
                    </Table1>
                 </Subform3>
                 <Subform4>
                    <Table2>
                       <Row2>
                          <sumqty>${_sumqty}</sumqty>
                          <Khongdung></Khongdung>
                          <sum>${_sum}</sum>
                       </Row2>
                    </Table2>
                 </Subform4>
                 <Subform5>
                    <From></From>
                 </Subform5>
                 <Subform6>
                    <Subform7>
                       <Term></Term>
                       <CheckBox1>${_checkin}</CheckBox1>
                       <Termdata>${_term_in}</Termdata>
                       <DLdate>${_date_in}</DLdate>
                       <Location></Location>
                       <Port></Port>
                    </Subform7>
                    <Subform8>
                       <Term></Term>
                       <CheckBox1>${_checkout}</CheckBox1>
                       <Term1>${_term_out}</Term1>
                       <Time>${_time_out}</Time>
                       <Loading>${_header.YY1_PortofLoading_PDH}</Loading>
                       <Discharge>${_header.YY1_PortofDischarge_PDH}</Discharge>
                    </Subform8>
                 </Subform6>
                 <Subform9>
                    <Paymethod>${_header.PaymentMethodsList}</Paymethod>
                    <Timepay>${_header.PaymentTerms}</Timepay>
                 </Subform9>
                 <Subform10>
                    <Vendor>Cong ty TNHH ABC</Vendor>
                    <Time></Time>
                 </Subform10>
              </form1>`;

              _xmlArr.push(_xmlStr);
            });

            var raw = JSON.stringify({ id: "ZMM01", data: _xmlArr });
            var url_render =
              "https://" +
              window.location.hostname +
              "/sap/bc/http/sap/z_api_pdf?=";
            $.ajax({
              url: url_render,
              type: "POST",
              contentType: "application/json",
              data: raw,
              success: function (response) {
                console.log("FileContent: ", response);
                var decodedPdfContent = atob(response);

                var byteArray = new Uint8Array(decodedPdfContent.length);
                for (var i = 0; i < decodedPdfContent.length; i++) {
                  byteArray[i] = decodedPdfContent.charCodeAt(i);
                }
                var blob = new Blob([byteArray.buffer], {
                  type: "application/pdf",
                });
                var _pdfurl = URL.createObjectURL(blob);

                if (!this._PDFViewer) {
                  this._PDFViewer = new sap.m.PDFViewer({
                    width: "auto",
                    source: _pdfurl,
                  });
                  jQuery.sap.addUrlWhitelist("blob");
                }
                this._PDFViewer.open();
                lv_close.close();
              },
              error: function (data) {
                console.log("message Error" + JSON.stringify(data));
              },
            });
          });
        });
      },
    };
  }
);
