const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const submitButton = document.querySelector("#submit-button");

contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";
    formStatus.textContent = "Sending your details...";

    try {
        await fetch(contactForm.action, {
            method: "POST",
            body: new URLSearchParams(new FormData(contactForm)),
            mode: "no-cors"
        });

        contactForm.reset();
        formStatus.textContent =
            "Thank you! Your details have been submitted.";
    } catch (error) {
        console.error("Contact form submission failed:", error);
        formStatus.textContent =
            "Unable to submit. Please check your connection and try again.";
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Submit";
    }
});
