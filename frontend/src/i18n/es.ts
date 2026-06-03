export const es = {
  app: {
    documentTitle: "QMI | Inteligencia de Migración Cuántica"
  },
  nav: {
    ariaLabel: "Menú de vista previa",
    language: "Idioma",
    languageAriaLabel: "Idioma",
    languages: {
      en: "English",
      es: "Spanish"
    },
    theme: "Tema",
    lightTheme: "Tema claro",
    darkTheme: "Tema oscuro",
    signIn: "Iniciar sesión"
  },
  hero: {
    eyebrow: "Preparación post-cuántica",
    title: "Inteligencia de Migración Cuántica",
    kicker: "PoC de repositorio a hoja de ruta",
    description:
      "Una PoC enfocada en mapear exposición criptográfica en repositorios y convertirla en una hoja de ruta práctica de migración post-cuántica."
  },
  scanForm: {
    ariaLabel: "Escaneo de repositorio",
    eyebrow: "Entrada de repositorio",
    title: "Construye una hoja de ruta de migración",
    repositoryUrl: "URL del repositorio de GitHub",
    repositoryPlaceholder: "https://github.com/org/repositorio",
    runScan: "Analizar repositorio",
    startingScan: "Analizando"
  },
  summary: {
    ariaLabel: "Resumen de preparación",
    eyebrow: "Puntuación de preparación",
    description: "Una puntuación compacta basada en el riesgo criptográfico detectado y la preparación de migración.",
    activeEyebrow: "Estado del escaneo",
    status: "Estado",
    stage: "Etapa",
    progress: "Progreso",
    findings: "Hallazgos",
    target: "Objetivo",
    repository: "Repositorio",
    githubSource: "Metadata pública de GitHub",
    githubAvatarAlt: "Avatar del owner del repositorio en GitHub",
    defaultBranch: "Rama por defecto",
    language: "Lenguaje",
    visibility: "Visibilidad",
    size: "Tamaño",
    pushed: "Último push",
    unknownMetadata: "Desconocido",
    sizeKb: "{size} KB",
    sizeMb: "{size} MB",
    filesDiscovered: "Descubiertos",
    filesCandidates: "Candidatos",
    filesScanned: "Analizados",
    filesSkipped: "Omitidos",
    elapsedTime: "Tiempo",
    secondsShort: "{seconds}s",
    limitAppliedTitle: "Límite de análisis público alcanzado",
    limitAppliedDescription: "{count} archivos candidatos fueron analizados en modo público. Inicia sesión para desbloquear el análisis completo del repositorio.",
    limitAppliedAction: "Iniciar sesión para análisis completo",
    noScanSelected: "Sin escaneo seleccionado",
    waitingForScan: "Ejecuta un escaneo de repositorio para ver progreso y cobertura.",
    noFindingsMatched:
      "Escaneo completado. Ningún hallazgo criptográfico coincidió con las reglas actuales. Esto no demuestra que el repositorio esté libre de criptografía.",
    scanError: "Error de escaneo",
    statuses: {
      idle: "inactivo",
      starting: "iniciando",
      pending: "pendiente",
      running: "en ejecución",
      completed: "completado",
      failed: "fallido"
    },
    stages: {
      queued: "En cola",
      cloning: "Clonando repositorio",
      discovering: "Descubriendo archivos",
      analyzing: "Analizando archivos",
      planning: "Generando hoja de ruta",
      completed: "Completado",
      failed: "Fallido"
    },
    messages: {
      scanQueued: "Escaneo en cola",
      cloningRepository: "Clonando repositorio",
      discoveringFiles: "Descubriendo archivos",
      analyzingCandidateFiles: "Analizando archivos candidatos",
      generatingMigrationPlan: "Generando plan de migración",
      scanCompleted: "Escaneo completado",
      scanCompletedWithoutFindings: "Escaneo completado. Ningún hallazgo criptográfico coincidió con las reglas actuales.",
      scanFailed: "El escaneo falló"
    }
  },
  risk: {
    ariaLabel: "Distribución de riesgo",
    eyebrow: "Distribución de riesgo",
    title: "Mezcla de hallazgos",
    levels: {
      all: "todos",
      critical: "crítico",
      vulnerable: "vulnerable",
      partial: "parcial",
      hybrid: "híbrido",
      safe: "seguro",
      unknown: "desconocido"
    }
  },
  migrationPlan: {
    ariaLabel: "Plan de migración",
    eyebrow: "Hoja de ruta priorizada",
    title: "Plan de migración",
    effortSuffix: "esfuerzo",
    emptyTitle: "Base de conocimiento de migración",
    emptyDescription: "Cuando aparezcan hallazgos, esta zona explicará por qué cada algoritmo está expuesto y qué debería reemplazarlo.",
    emptyCards: {
      algorithm: {
        title: "Algoritmo",
        body: "RSA, ECC, AES-128, SHA-1 y otros primitivos detectados se agrupan por rol criptográfico."
      },
      rationale: {
        title: "Por qué importa",
        body: "Cada hallazgo se mapea a exposición cuántica, uso obsoleto, confidencialidad a largo plazo o revisión manual."
      },
      replacement: {
        title: "Ruta de reemplazo",
        body: "Las recomendaciones apuntan a ML-KEM, ML-DSA, SLH-DSA, AES-256, SHA-384+ o migración híbrida."
      }
    }
  },
  findings: {
    ariaLabel: "Hallazgos del escaneo",
    eyebrow: "Hallazgos normalizados",
    title: "Activos criptográficos en riesgo",
    count: "{filtered} de {total}",
    filtersAriaLabel: "Filtros de hallazgos",
    search: "Buscar",
    searchPlaceholder: "Algoritmo, categoría o ruta",
    risk: "Riesgo",
    allRisks: "Todos los riesgos",
    algorithm: "Algoritmo",
    allAlgorithms: "Todos los algoritmos",
    context: "Contexto",
    primaryContexts: "Contextos principales",
    contexts: {
      "source-code": "código fuente",
      configuration: "configuración",
      "dependency-manifest": "manifest de dependencias",
      documentation: "documentación",
      test: "test",
      example: "ejemplo",
      generated: "generado",
      unknown: "desconocido"
    },
    clearFilters: "Limpiar filtros",
    rowsPerPage: "Filas por página",
    pageStatus: "Página {page} de {totalPages}",
    previousPage: "Anterior",
    nextPage: "Siguiente",
    category: "Categoría",
    location: "Ubicación",
    confidence: "Confianza",
    all: "todos",
    noFindings: "Aún no hay hallazgos.",
    completedWithoutFindings:
      "El escaneo terminó correctamente, pero las reglas actuales no detectaron uso criptográfico en los archivos analizados.",
    noMatches: "Ningún hallazgo coincide con los filtros actuales.",
    unknownLocation: "Ubicación desconocida"
  },
  toasts: {
    notifications: "Notificaciones",
    dismiss: "Descartar notificación",
    scanCompleted: "Escaneo completado con {count} hallazgo(s).",
    scanFailed: "El escaneo falló. Revisa los detalles del escaneo.",
    refreshFailed: "No se pudo actualizar el estado del escaneo.",
    scanStarted: "Escaneo iniciado. Los resultados se actualizarán automáticamente.",
    scanRequestFailed: "La solicitud de escaneo falló. Revisa los detalles del escaneo."
  },
  footer: {
    ecosystemIntent: "PoC creada con la intención de encajar en ecosistemas de seguridad como",
    logosLabel: "Google y VirusTotal",
    googleLogoAlt: "Google",
    virustotalLogoAlt: "VirusTotal",
    linkMark: "x",
    inspiredBy: "Inspirada en",
    qrammTools: "herramientas open-source de QRAMM"
  }
} as const;
