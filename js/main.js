const { PDFDocument } = PDFLib;
var _signaturePad;
let _orgName, _orgCIF, _orgIBAN, _percent;

window.onload = function () {
    var canvas = document.getElementById("signature-pad");
    _signaturePad = new SignaturePad(canvas, { penColor: "rgb(255, 255, 255)" });
    GetAndSetConfig();
    SetVisibility("mainDiv", true);
    AddStatistic("Visits");
};

function GetAndSetConfig() {
    fetch('config.json')
        .then((response) => response.json())
        .then(
            function(jsonData) {
                _orgName = jsonData.OrgName;
                _orgCIF = jsonData.OrgCIF;
                _orgIBAN = jsonData.OrgIBAN;
                _percent = jsonData.Percent;
                document.title = `Formular 230 ANAF pentru ${_orgName}`;
                document.getElementById("infoTitle").innerHTML = `Formular 230 ANAF pentru ${_orgName}`;
                let pInfo1 = document.getElementById("pInfo1");
                pInfo1.innerHTML = pInfo1.innerHTML.replace("{{OrgName}}", _orgName);
            }
        );
}

function Start() {
    SetVisibility("info", false);
    SetVisibility("form", true);
}

function ClearSignature() {
    _signaturePad.clear();
}

function ShowModalMessage(msgId) {
    let message = "";
    if (msgId == 1) { message = "Formularul tău a fost generat cu succes!<br />Descărcarea lui a început."; }
    else if (msgId == 2) { message = "Te rog să completezi toate câmpurile obligatorii!"; }
    else if (msgId == 3) { message = "Te rog să te semnezi!"; }
    else { message = `A apărut o eroare:<br />${msgId}`; }
    document.getElementById("mainModalMessage").innerHTML = message;
    let mainModal = new bootstrap.Modal(document.getElementById("mainModal"), {});
    mainModal.show();
}

async function Generate() {
    try {
        console.log("Generate started...");
        if (_signaturePad.isEmpty()) {
            ShowModalMessage(3);
            return;
        }

        const formUrl = 'assets/Formular230.pdf';
        const formPdfBytes = await fetch(formUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(formPdfBytes);
        const form = pdfDoc.getForm();

        pdfDoc.registerFontkit(fontkit);
        const fontBytes = await fetch("assets/MyriadPro-regular.otf").then(res => res.arrayBuffer());
        const customFont = await pdfDoc.embedFont(fontBytes);
        const rawUpdateFieldAppearances = form.updateFieldAppearances.bind(form);
        form.updateFieldAppearances = function () {
            return rawUpdateFieldAppearances(customFont);
        };

        let nume = document.getElementById("nume").value;
        let prenume = document.getElementById("prenume").value;

        form.getTextField('an').setText((new Date().getFullYear() - 1).toString());
        form.getTextField('nume').setText(nume);
        form.getTextField('prenume').setText(prenume);
        form.getTextField('initiala').setText(document.getElementById("initialaTatalui").value);
        form.getTextField('cnp').setText(document.getElementById("cnp").value);
        form.getTextField('mail').setText(document.getElementById("email").value);
        form.getTextField('telefon').setText(document.getElementById("telefon").value);
        form.getTextField('strada').setText(document.getElementById("strada").value);
        form.getTextField('nr').setText(document.getElementById("nrStrada").value);
        form.getTextField('bloc').setText(document.getElementById("bloc").value);
        form.getTextField('scara').setText(document.getElementById("scara").value);
        form.getTextField('etaj').setText(document.getElementById("etaj").value);
        form.getTextField('apartament').setText(document.getElementById("apartament").value);
        form.getTextField('judet').setText(document.getElementById("judet").value);
        form.getTextField('localitate').setText(document.getElementById("localitate").value);
        form.getTextField('zip').setText(document.getElementById("codPostal").value);
        if (document.getElementById("doiAni").checked) { form.getTextField('doi_ani').setText('X'); }
        form.getTextField('target_cif').setText(_orgCIF);
        form.getTextField('target_name').setText(_orgName);
        form.getTextField('target_iban').setText(_orgIBAN);
        form.getTextField('a5').setText(_percent);

        form.flatten();
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        UpdateSignaturePadColor("rgb(0, 0, 0)");

        const signatureData = _signaturePad.toDataURL();
        const pngSignature = await pdfDoc.embedPng(signatureData);
        const pngDims = pngSignature.scale(0.4);

        firstPage.drawImage(pngSignature, {
            x: 125,
            y: 105,
            //x: page.getWidth() / 2 - pngDims.width / 2 + 75,
            //y: page.getHeight() / 2 - pngDims.height + 250,
            width: pngDims.width,
            height: pngDims.height,
        });
        UpdateSignaturePadColor("rgb(255, 255, 255)");

        const pdfBytes = await pdfDoc.save();
        ShowModalMessage(1);
        download(pdfBytes, `Formular 230 ${prenume} ${nume}.pdf`, "application/pdf");
        AddStatistic("Generations");
    }
    catch (error) {
        console.log(error);
        ShowModalMessage(error.message);
    }
}

function UpdateSignaturePadColor(color) {
    _signaturePad.penColor = color;
    const data = _signaturePad.toData();
    _signaturePad.fromData(data.map(d => {
        d.penColor = color;
        return d;
    }));
}

function AddStatistic(statisticId) {
    if (statisticId == null) { return; }
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
            if (xmlhttp.status != 200) {
                console.log(`Error: AddStatistic returned ${xmlhttp.status}`);
            }
        }
    };
    xmlhttp.open("POST", `stats.php?id=${statisticId}`, true);
    xmlhttp.setRequestHeader("X-GUID", GenerateGUID());
    xmlhttp.send();
}

function GenerateGUID() {
    try {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    } catch (error) {
        return "QWxleCBWaXJsYW4=";
    }
}

function SetVisibility(elementId, visible) {
    if (visible) {
        document.getElementById(elementId).classList.remove("d-none");
    }
    else {
        document.getElementById(elementId).classList.add("d-none");
    }
}