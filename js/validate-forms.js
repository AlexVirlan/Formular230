(() => {
    'use strict'
    const forms = document.querySelectorAll('.needs-validation')
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            console.log("Validation event fired...");
            event.preventDefault();
            event.stopPropagation();

            form.classList.add('was-validated');
            if (form.checkValidity()) {
                Generate();
            }
            else {
                ShowModalMessage(2);
            }
        }, false)
    })
})()