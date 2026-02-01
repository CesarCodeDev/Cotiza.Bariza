document.getElementById("Btn_acceder").addEventListener("click", function () {
    var usuario = document.getElementById("Lbl_usuario").value;
    var pin = document.getElementById("Lbl_pin").value;

    // Cargar los datos del archivo JSON
    fetch("Scripts/data.json")
        .then(response => response.json())
        .then(data => {
            var credenciales = data.Credenciales;

            if (usuario === credenciales.Cedula && pin === credenciales.Clave) {
                sessionStorage.setItem("usuario_activo", usuario);
                
                document.getElementById("Lbl_error").textContent = "Acceso exitoso.";
                setTimeout(() => {
                    document.getElementById("Lbl_error").textContent = "";
                }, 2000);
                // Redirigir al usuario a la página principal
                window.location.href = "Views/Price-view.html";
            } else {
                document.getElementById("Lbl_error").textContent = "Credenciales incorrectas.";
                setTimeout(() => {
                    document.getElementById("Lbl_error").textContent = "";
                }, 2000);
            }
        })
        .catch(error => {
            console.error("Error al cargar el archivo JSON:", error);
        });
});