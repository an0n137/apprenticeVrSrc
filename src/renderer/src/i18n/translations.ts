export type Language = 'en' | 'es'

const translations = {
  en: {
    // App header
    appName: 'Apprentice VR',
    downloads: 'Downloads',
    uploads: 'Uploads',
    games: 'Games',
    settings: 'Settings',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    close: 'Close',

    // Status bar (header buttons)
    uploading: 'Uploading',
    extracting: 'Extracting',
    installing: 'Installing',

    // Connectivity / dependency errors
    networkConnectivityIssues: 'Network Connectivity Issues',
    cannotReachServices: 'Cannot reach the following services:',
    connectivityHint:
      'This is likely due to DNS or firewall restrictions. Please try:',
    connectivityTip1: 'Change your DNS to Cloudflare (1.1.1.1) or Google (8.8.8.8)',
    connectivityTip2: 'Use a VPN like ProtonVPN or 1.1.1.1 VPN',
    connectivityTip3: 'Check your router/firewall settings',
    troubleshootingGuide: 'Troubleshooting Guide',
    forTroubleshooting: 'For detailed troubleshooting, see:',
    dependencyError: 'Dependency Error',
    checkingRequirements: 'Checking requirements...',
    checkingNetworkConnectivity: 'Checking network connectivity...',

    // UploadsView
    noUploadsInQueue: 'No uploads in queue',
    game: 'Game',
    packageName: 'Package Name',
    version: 'Version',
    status: 'Status',
    actions: 'Actions',
    waitingInQueue: 'Waiting in queue',
    completed: 'Completed',
    error: 'Error',
    cancelled: 'Cancelled',
    uploadLocalFiles: 'Upload Local Files',
    removeFromHistory: 'Remove from history',
    removeFromQueue: 'Remove from queue',
    cancelUpload: 'Cancel upload',
    retryUpload: 'Retry upload',

    // LocalUploadDialog
    localUploadTitle: 'Upload Local Files',
    localUploadDescription:
      'Select folders containing APK files or ZIP archives to upload to the server. Each folder must contain exactly one APK file.',
    localUploadRules:
      'How it works: Each selected folder must contain exactly one APK file. It can also contain an OBB folder, instruction files, or other related content. If you have multiple APKs, put each in its own separate folder.',
    addFolders: 'Add Folders',
    addZipFiles: 'Add ZIP Files',
    selectedItems: 'Selected items',
    name: 'Name',
    type: 'Type',
    folder: 'Folder',
    zipFile: 'ZIP file',
    remove: 'Remove',
    cancel: 'Cancel',
    uploadItems: 'Upload',
    validating: 'Validating...',
    uploadFailedValidation: 'Upload refused — validation errors:',
    noItemsSelected: 'No items selected. Add folders or ZIP files above.',

    // UploadGamesDialog
    uploadGamesTitle: 'Upload Games',
    uploadGamesDescription:
      'We found games on your device that could benefit the community. These games are either missing in our database or newer than the versions we have.',
    uploadColumn: 'Upload',
    missingFromDatabase: 'Missing from database',
    newerThanDatabase: 'Newer than database',
    blacklistSelected: 'Blacklist Selected',
    uploadSelectedGames: 'Upload Selected Games',

    // Settings
    applicationSettings: 'Application Settings',
    configurePreferences: 'Configure application preferences and manage your downloads',
    downloadSettings: 'Download Settings',
    downloadSettingsDesc: 'Set where your games will be downloaded and stored on your device',
    downloadPath: 'Download path',
    savePath: 'Save Path',
    downloadSpeedLimit: 'Download Speed Limit',
    uploadSpeedLimit: 'Upload Speed Limit',
    unlimited: 'Unlimited',
    unlimitedHint: 'Leave empty for unlimited speed',
    saveSpeedLimits: 'Save Speed Limits',
    blacklistedGames: 'Blacklisted Games',
    blacklistedGamesDesc: 'Manage games that will not prompt for uploads',
    noBlacklistedGames: 'No blacklisted games found',
    loadingBlacklist: 'Loading blacklisted games...',
    allVersions: 'All Versions',
    blacklistRemoveSuccess: 'Game removed from blacklist successfully',
    blacklistLoadError: 'Failed to load blacklisted games',
    blacklistRemoveError: 'Failed to remove game from blacklist',
    logUpload: 'Log Upload',
    logUploadDesc: 'Upload the current log file for sharing with support',
    uploadCurrentLog: 'Upload Current Log',
    uploading_log: 'Uploading...',
    logUploadSuccess: 'Log uploaded successfully!',
    url: 'URL:',
    copyUrl: 'Copy URL',
    password: 'Password:',
    copyPassword: 'Copy Password',
    logUploadHint:
      'The uploaded log file will be available on catbox.moe. Share only the URL with support for troubleshooting.',
    mirrorsAndServer: 'Mirrors & Server Configuration',
    openMirrorManagement: 'Open Mirror Management',
    settingsSaved: 'Settings saved successfully',
    failedToSavePath: 'Failed to save download path',
    failedToSaveSpeed: 'Failed to save speed limits',
    invalidNumbers: 'Please enter valid numbers for speed limits',
    downloadPathEmpty: 'Download path cannot be empty',
    language: 'Language',
    languageDesc: 'Choose the application display language',
    languageEnglish: 'English',
    languageSpanish: 'Español (Castellano)',
    browseFolders: 'Browse folders',

    // Device list
    connecting: 'Connecting...',
    noDevicesFound: 'No devices found',
    connectDevice: 'Connect',
    skipConnection: 'Continue without device',
  },

  es: {
    // Cabecera de la app
    appName: 'Apprentice VR',
    downloads: 'Descargas',
    uploads: 'Subidas',
    games: 'Juegos',
    settings: 'Ajustes',
    darkMode: 'Modo oscuro',
    lightMode: 'Modo claro',
    close: 'Cerrar',

    // Barra de estado
    uploading: 'Subiendo',
    extracting: 'Extrayendo',
    installing: 'Instalando',

    // Errores de conectividad / dependencias
    networkConnectivityIssues: 'Problemas de conectividad de red',
    cannotReachServices: 'No se puede conectar con los siguientes servicios:',
    connectivityHint:
      'Esto probablemente se debe a restricciones de DNS o cortafuegos. Prueba lo siguiente:',
    connectivityTip1: 'Cambia tu DNS a Cloudflare (1.1.1.1) o Google (8.8.8.8)',
    connectivityTip2: 'Usa una VPN como ProtonVPN o 1.1.1.1 VPN',
    connectivityTip3: 'Revisa la configuración de tu router/cortafuegos',
    troubleshootingGuide: 'Guía de resolución de problemas',
    forTroubleshooting: 'Para más información, consulta:',
    dependencyError: 'Error de dependencia',
    checkingRequirements: 'Comprobando requisitos...',
    checkingNetworkConnectivity: 'Comprobando conectividad de red...',

    // Vista de subidas
    noUploadsInQueue: 'No hay subidas en cola',
    game: 'Juego',
    packageName: 'Nombre del paquete',
    version: 'Versión',
    status: 'Estado',
    actions: 'Acciones',
    waitingInQueue: 'Esperando en cola',
    completed: 'Completado',
    error: 'Error',
    cancelled: 'Cancelado',
    uploadLocalFiles: 'Subir archivos locales',
    removeFromHistory: 'Eliminar del historial',
    removeFromQueue: 'Eliminar de la cola',
    cancelUpload: 'Cancelar subida',
    retryUpload: 'Reintentar subida',

    // Diálogo de subida local
    localUploadTitle: 'Subir archivos locales',
    localUploadDescription:
      'Selecciona carpetas con archivos APK o archivos ZIP para subir al servidor. Cada carpeta debe contener exactamente un archivo APK.',
    localUploadRules:
      'Cómo funciona: Cada carpeta seleccionada debe contener exactamente un archivo APK. También puede contener una carpeta OBB, instrucciones u otro contenido relacionado. Si tienes varios APK, coloca cada uno en su propia carpeta separada.',
    addFolders: 'Añadir carpetas',
    addZipFiles: 'Añadir archivos ZIP',
    selectedItems: 'Elementos seleccionados',
    name: 'Nombre',
    type: 'Tipo',
    folder: 'Carpeta',
    zipFile: 'Archivo ZIP',
    remove: 'Eliminar',
    cancel: 'Cancelar',
    uploadItems: 'Subir',
    validating: 'Validando...',
    uploadFailedValidation: 'Subida rechazada — errores de validación:',
    noItemsSelected: 'No hay elementos seleccionados. Añade carpetas o archivos ZIP arriba.',

    // Diálogo de subida de juegos del dispositivo
    uploadGamesTitle: 'Subir juegos',
    uploadGamesDescription:
      'Hemos encontrado juegos en tu dispositivo que pueden beneficiar a la comunidad. Estos juegos no están en nuestra base de datos o tienen versiones más nuevas.',
    uploadColumn: 'Subir',
    missingFromDatabase: 'No está en la base de datos',
    newerThanDatabase: 'Más nuevo que la base de datos',
    blacklistSelected: 'Añadir a lista negra',
    uploadSelectedGames: 'Subir juegos seleccionados',

    // Ajustes
    applicationSettings: 'Ajustes de la aplicación',
    configurePreferences: 'Configura las preferencias de la aplicación y gestiona tus descargas',
    downloadSettings: 'Ajustes de descarga',
    downloadSettingsDesc: 'Establece dónde se descargarán y almacenarán tus juegos',
    downloadPath: 'Ruta de descarga',
    savePath: 'Guardar ruta',
    downloadSpeedLimit: 'Límite de velocidad de descarga',
    uploadSpeedLimit: 'Límite de velocidad de subida',
    unlimited: 'Ilimitado',
    unlimitedHint: 'Deja en blanco para velocidad ilimitada',
    saveSpeedLimits: 'Guardar límites de velocidad',
    blacklistedGames: 'Juegos en lista negra',
    blacklistedGamesDesc: 'Gestiona los juegos que no solicitarán subida',
    noBlacklistedGames: 'No hay juegos en la lista negra',
    loadingBlacklist: 'Cargando lista negra...',
    allVersions: 'Todas las versiones',
    blacklistRemoveSuccess: 'Juego eliminado de la lista negra correctamente',
    blacklistLoadError: 'Error al cargar la lista negra',
    blacklistRemoveError: 'Error al eliminar el juego de la lista negra',
    logUpload: 'Subida de registros',
    logUploadDesc: 'Sube el archivo de registro actual para compartirlo con el soporte',
    uploadCurrentLog: 'Subir registro actual',
    uploading_log: 'Subiendo...',
    logUploadSuccess: '¡Registro subido correctamente!',
    url: 'URL:',
    copyUrl: 'Copiar URL',
    password: 'Contraseña:',
    copyPassword: 'Copiar contraseña',
    logUploadHint:
      'El archivo de registro subido estará disponible en catbox.moe. Comparte solo la URL con el soporte técnico.',
    mirrorsAndServer: 'Espejos y configuración del servidor',
    openMirrorManagement: 'Abrir gestión de espejos',
    settingsSaved: 'Ajustes guardados correctamente',
    failedToSavePath: 'Error al guardar la ruta de descarga',
    failedToSaveSpeed: 'Error al guardar los límites de velocidad',
    invalidNumbers: 'Introduce números válidos para los límites de velocidad',
    downloadPathEmpty: 'La ruta de descarga no puede estar vacía',
    language: 'Idioma',
    languageDesc: 'Elige el idioma de visualización de la aplicación',
    languageEnglish: 'English',
    languageSpanish: 'Español (Castellano)',
    browseFolders: 'Explorar carpetas',

    // Lista de dispositivos
    connecting: 'Conectando...',
    noDevicesFound: 'No se encontraron dispositivos',
    connectDevice: 'Conectar',
    skipConnection: 'Continuar sin dispositivo',
  }
} as const

export type TranslationKey = keyof (typeof translations)['en']

export function getTranslations(lang: Language): (typeof translations)['en'] {
  return translations[lang] ?? translations.en
}

export default translations
