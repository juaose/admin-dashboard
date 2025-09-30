import { I18n } from "aws-amplify/utils";
import { translations } from "@aws-amplify/ui-react";
import { AuthHeader } from "../components/auth/AuthHeader";
import { AuthFooter } from "../components/auth/AuthFooter";

// Set up Spanish translations
I18n.putVocabularies(translations);
I18n.setLanguage("es");

// Custom Spanish translations with comprehensive error handling
I18n.putVocabularies({
  es: {
    // Basic UI elements
    "Sign In": "Iniciar Sesión",
    "Sign Up": "Registrarse",
    "Sign Out": "Cerrar Sesión",
    "Sign in": "Iniciar Sesión",
    "Sign up": "Registrarse",
    "Create Account": "Crear Cuenta",
    "Forgot your password?": "¿Olvidaste tu contraseña?",
    "Reset password": "Restablecer contraseña",
    "Reset Password": "Restablecer Contraseña",
    "Back to Sign In": "Volver a Iniciar Sesión",
    "Send code": "Enviar código",
    Confirm: "Confirmar",
    "Resend Code": "Reenviar Código",
    Submit: "Enviar",
    Email: "Correo electrónico",
    Password: "Contraseña",
    "Confirm Password": "Confirmar Contraseña",
    "Enter your email": "Ingresa tu correo electrónico",
    "Enter your password": "Ingresa tu contraseña",
    "Please confirm your password": "Por favor confirma tu contraseña",
    "Confirmation Code": "Código de Confirmación",
    "Enter your code": "Ingresa tu código",
    "Lost your code?": "¿Perdiste tu código?",
    Skip: "Omitir",
    "Change Password": "Cambiar Contraseña",
    "New Password": "Nueva Contraseña",

    // Status messages
    "We Emailed You": "Te Enviamos un Correo",
    "We Texted You": "Te Enviamos un Mensaje",
    "Your code is on the way. To log in, enter the code we emailed to":
      "Tu código está en camino. Para iniciar sesión, ingresa el código que enviamos a",
    "Your code is on the way. To log in, enter the code we texted to":
      "Tu código está en camino. Para iniciar sesión, ingresa el código que enviamos por mensaje a",
    "It may take a minute to arrive.": "Puede tardar un minuto en llegar.",

    // Error messages - Authentication
    "Incorrect username or password.": "Usuario o contraseña incorrectos.",
    "User does not exist.": "El usuario no existe.",
    "User already exists": "El usuario ya existe",
    "Invalid verification code provided, please try again.":
      "Código de verificación inválido, por favor intenta de nuevo.",
    "Invalid password format": "Formato de contraseña inválido",
    "Password attempts exceeded": "Intentos de contraseña excedidos",

    // Error messages - Password validation
    "Password must have at least 8 characters":
      "La contraseña debe tener al menos 8 caracteres",
    "Password must have at least one lowercase letter":
      "La contraseña debe tener al menos una letra minúscula",
    "Password must have at least one uppercase letter":
      "La contraseña debe tener al menos una letra mayúscula",
    "Password must have at least one number":
      "La contraseña debe tener al menos un número",
    "Password must have at least one special character":
      "La contraseña debe tener al menos un carácter especial",
    "Passwords do not match": "Las contraseñas no coinciden",

    // Error messages - Account and verification
    "An account with the given email already exists.":
      "Ya existe una cuenta con el correo electrónico proporcionado.",
    "Account recovery requires verified contact information":
      "La recuperación de cuenta requiere información de contacto verificada",
    "Invalid phone number format": "Formato de número de teléfono inválido",
    "Code mismatch": "El código no coincide",
    "Expired code": "Código expirado",
    "Invalid code": "Código inválido",

    // Error messages - Network and system
    "Network error": "Error de conexión",
    "Something went wrong": "Algo salió mal",
    "Please try again": "Por favor intenta de nuevo",
    "Service temporarily unavailable": "Servicio temporalmente no disponible",
    "Too many requests": "Demasiadas solicitudes",
    "Request timeout": "Tiempo de espera agotado",

    // Loading states
    "Loading...": "Cargando...",
    "Signing in...": "Iniciando sesión...",
    "Sending code...": "Enviando código...",
    "Verifying...": "Verificando...",
    "Processing...": "Procesando...",
  },
});

// Organized form field configurations
const commonFieldStyles = {
  isRequired: true,
  labelHidden: false,
};

const emailField = {
  ...commonFieldStyles,
  placeholder: "Ingresa tu correo electrónico",
  label: "Correo electrónico",
};

const passwordField = {
  ...commonFieldStyles,
  placeholder: "Ingresa tu contraseña",
  label: "Contraseña",
};

const confirmPasswordField = {
  ...commonFieldStyles,
  placeholder: "Confirma tu contraseña",
  label: "Confirmar contraseña",
};

const codeField = {
  ...commonFieldStyles,
  placeholder: "Ingresa el código de confirmación",
  label: "Código de confirmación",
};

// Form field customization with improved organization
export const formFields = {
  signIn: {
    username: emailField,
    password: passwordField,
  },
  signUp: {
    email: {
      ...emailField,
      order: 1,
    },
    password: {
      ...passwordField,
      order: 2,
    },
    confirm_password: {
      ...confirmPasswordField,
      order: 3,
    },
  },
  forgotPassword: {
    username: {
      ...emailField,
      isRequired: true,
    },
  },
  confirmResetPassword: {
    confirmation_code: codeField,
    confirm_password: {
      ...commonFieldStyles,
      placeholder: "Ingresa tu nueva contraseña",
      label: "Nueva contraseña",
    },
  },
  forceNewPassword: {
    password: {
      ...commonFieldStyles,
      placeholder: "Ingresa tu nueva contraseña",
      label: "Nueva contraseña",
    },
  },
};

// Component customization with dedicated components
export const components = {
  Header() {
    return <AuthHeader />;
  },
  Footer() {
    return <AuthFooter />;
  },
  SignIn: {
    Header() {
      return (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <h2 style={{ color: "var(--text-primary)", margin: 0 }}>
            Iniciar Sesión
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            SÓLO PERSONAL AUTORIZADO
          </p>
        </div>
      );
    },
  },
  ForgotPassword: {
    Header() {
      return (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <h2 style={{ color: "var(--text-primary)", margin: 0 }}>
            Restablecer Contraseña
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Ingresa tu correo para recibir el código de recuperación
          </p>
        </div>
      );
    },
  },
  ConfirmResetPassword: {
    Header() {
      return (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <h2 style={{ color: "var(--text-primary)", margin: 0 }}>
            Nueva Contraseña
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Ingresa el código y tu nueva contraseña
          </p>
        </div>
      );
    },
  },
};
