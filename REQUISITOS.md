# 4.1 Requisitos funcionales

## Gestión de Clientes

**RF-01 Registrar Cliente**
El sistema deberá permitir registrar una empresa cliente mediante un formulario que solicite:
- Nombre comercial
- Razón social
- RFC
- Industria (opcional)

Al finalizar el registro, la empresa deberá quedar asociada al contador autenticado.

**RF-02 Consultar Clientes**
El sistema deberá mostrar la lista de empresas cliente registradas por el contador autenticado.

**RF-03 Seleccionar Cliente**
El sistema deberá permitir seleccionar una empresa cliente para realizar análisis financieros. Toda la información mostrada posteriormente deberá corresponder a la empresa seleccionada. La selección es única — exactamente un cliente activo a la vez. Al cambiar de cliente, la conversación activa se limpia y el panel de insights se recarga para el nuevo cliente.

## Carga de Datos

**RF-04 Subir Archivo Excel**
El sistema deberá permitir subir un archivo Excel (.xlsx, máximo 10 MB) asociado a un cliente y un tipo de tabla (ventas/gastos/nómina). El periodo deberá detectarse automáticamente a partir de las columnas de fecha.

**RF-05 Mapeo de Columnas con IA**
El sistema deberá enviar únicamente los encabezados de columna más 3 filas de muestra al LLM para generar un mapeo entre las columnas del archivo y las columnas de la base de datos. El LLM deberá devolver un JSON con el mapeo de columnas, las transformaciones necesarias y los periodos detectados.

**RF-06 Reutilizar Mapeo Anterior**
El sistema deberá cachear el mapeo por (accountant_id, client_id, table_type, conjunto ordenado de columnas). Al detectar un archivo con las mismas columnas, deberá preguntar al usuario "¿Usar mapeo anterior?" con las columnas detectadas mostradas. El usuario puede aceptar o solicitar un mapeo nuevo.

**RF-07 Reemplazar Datos al Subir**
Al subir un archivo Excel para un cliente, tipo de tabla y periodo, el sistema deberá reemplazar completamente los datos existentes para esa combinación. No deberán acumularse ni duplicarse registros del mismo periodo.

**RF-08 Consultar Historial de Cargas**
El sistema deberá mostrar el historial de cargas para un cliente, ordenado del más reciente al más antiguo. Cada carga deberá mostrar: tipo de tabla, periodo, número de filas procesadas, filas omitidas y columnas no utilizadas.

**RF-09 Visualizar Resumen de Carga**
Después de cada carga, el sistema deberá mostrar un resumen con el formato:
- Tipo de tabla y periodo (ej. "Ventas — Abril 2025")
- Filas procesadas
- Filas omitidas (con motivo)
- Columnas no utilizadas

**RF-10 Auto-poblar Periodos**
El sistema deberá poblar automáticamente la tabla de periodos a partir de las fechas encontradas en los datos cargados. El selector de periodo solo deberá mostrar periodos con datos para el cliente seleccionado.

## Dashboard

**RF-11 Consultar Información Financiera**
El sistema deberá obtener información financiera desde los datos cargados para la empresa seleccionada y el periodo seleccionado.

**RF-12 Visualizar Indicadores Financieros**
El sistema deberá mostrar cuatro tarjetas KPI:
- Ingresos (ventas totales del periodo + % vs periodo anterior)
- Costos (gastos totales del periodo + % vs periodo anterior)
- Utilidad (ingresos - costos + % vs periodo anterior)
- Flujo de caja (flujo de efectivo operativo + indicador de tendencia: mejorando/estable/debilitándose)

**RF-13 Seleccionar Periodo**
El sistema deberá mostrar un selector de periodo (dropdown) con solo los periodos que tienen datos cargados para el cliente seleccionado, en orden cronológico descendente. Al cambiar el periodo, todos los KPIs, gráficas y el contexto del chat deberán actualizarse.

**RF-14 Visualizar Gráficas**
El sistema deberá representar la información financiera mediante visualizaciones renderizadas a partir de configuración JSON. Tipos de visualización soportados:
- Gráfica de líneas (tendencias en el tiempo)
- Gráfica de barras (comparaciones)
- Gráfica de pastel (concentración)
- Tabla (listados ordenados)

**RF-15 Navegación Rápida**
El sistema deberá mostrar enlaces rápidos para navegar al Chat o a Insights del cliente seleccionado desde el Dashboard.

## Conversaciones

**RF-16 Crear Conversación**
El sistema deberá permitir iniciar una nueva conversación asociada a la empresa cliente seleccionada. Al cambiar de cliente, la conversación anterior se conserva y se inicia una nueva.

**RF-17 Enviar Mensaje**
El sistema deberá permitir enviar mensajes en lenguaje natural dentro de una conversación.

**RF-18 Generar Respuesta**
El sistema deberá generar una respuesta utilizando los datos financieros cargados para la empresa seleccionada. La respuesta puede incluir texto en español y/o una configuración JSON para gráfica.

**RF-19 Almacenar Mensajes**
El sistema deberá almacenar los mensajes enviados por el usuario y las respuestas generadas por el asistente.

**RF-20 Consultar Historial de Conversación**
El sistema deberá permitir visualizar el historial completo de mensajes pertenecientes a una conversación.

**RF-21 Mantener Contexto Conversacional**
El sistema deberá utilizar los mensajes previos de una conversación para interpretar consultas posteriores relacionadas.

**RF-22 Generar Resumen Mensual**
El sistema deberá generar un resumen automático al recibir frases como "Genera resumen mensual" o "Resumen de mayo". El resumen debe incluir:
- Tendencia de ingresos (vs periodo anterior, vs mismo periodo año anterior si está disponible)
- Tendencia de gastos (total y por categorías principales)
- Tendencia de utilidad (absoluta y margen %)
- Cambios notables (anomalías con >10% de cambio)

**RF-23 Explicar Variaciones**
Al recibir preguntas como "¿Por qué bajó la utilidad?", "¿Por qué aumentaron los gastos?" o "¿Por qué empeoró el flujo?", el sistema deberá identificar los factores contribuyentes y cuantificarlos, listando cada factor con su contribución a la variación total.

## Agente de Conversación

**RF-24 Consultar Esquema de Datos**
El agente deberá poder consultar el esquema de la base de datos (tablas, columnas, tipos, llaves foráneas) filtrado al cliente seleccionado. Esta herramienta se invoca al inicio de la conversación o cuando el agente necesita recordar el esquema.

**RF-25 Ejecutar Consultas SQL**
El agente deberá poder ejecutar consultas SQL de solo lectura. El backend deberá inyectar los filtros `accountant_id` y `client_id` como parámetros vinculados — el LLM no puede sobrescribir estos valores. Retorna las filas y nombres de columna como JSON.

**RF-26 Generar Configuración de Gráfica**
El agente deberá poder generar una configuración JSON de gráfica cuando determine que una visualización sería útil. El formato debe incluir: tipo de gráfica, título, etiquetas, conjuntos de datos (con label, data, color opcional) y etiqueta de periodo opcional.

**RF-27 Buscar Insights Guardados**
El agente deberá poder buscar insights guardados existentes para el cliente actual por palabra clave, permitiendo referenciar hallazgos pasados.

**RF-28 Reintentar en Error SQL**
Si una consulta SQL genera un error, el agente deberá reflexionar, corregir la consulta y reintentar hasta un máximo de 10 intentos.

## Gestión de Insights

**RF-30 Guardar Insight**
El sistema deberá permitir almacenar una respuesta generada por el asistente como insight, únicamente si la respuesta incluye una gráfica. Las respuestas de solo texto no pueden guardarse.

**RF-31 Consultar Insights**
El sistema deberá mostrar los insights asociados a la empresa seleccionada.

**RF-32 Actualizar Insight**
El sistema deberá permitir re-ejecutar la pregunta original de un insight contra un nuevo periodo. El agente se ejecutará nuevamente y generará una nueva respuesta y configuración de gráfica.

**RF-33 Eliminar Insight**
El sistema deberá permitir eliminar un insight. No hay cascada — los insights eliminados se pierden permanentemente.

**RF-34 Análisis Proactivo Bajo Demanda**
El sistema deberá generar hallazgos notables al hacer clic en "Analizar". El sistema envía un resumen de los datos actuales al LLM y pregunta qué es notable sobre los datos financieros del cliente. Retorna una lista de hallazgos, cada uno con título, descripción y gráfica opcional. Los resultados son efímeros (no se persisten).

## Autenticación

**RF-35 Iniciar Sesión**
El sistema deberá permitir el acceso mediante correo electrónico y contraseña. La sesión se mantiene mediante JWT que codifica el `accountant_id`.

**RF-36 Cerrar Sesión**
El sistema deberá permitir finalizar la sesión activa del usuario.

---

# 4.2 Requerimientos no funcionales

## Calidad de servicio

**RNF-01 Tiempo de Respuesta del Dashboard**
El sistema deberá mostrar la información financiera de un cliente en un tiempo máximo de 5 segundos después de su selección.

**RNF-02 Tiempo de Respuesta del Asistente**
El sistema deberá generar una respuesta a una consulta realizada por el usuario en un tiempo máximo de 2 minutos.

**RNF-03 Persistencia de Información**
Las conversaciones, mensajes e insights almacenados deberán permanecer disponibles para su consulta posterior después del cierre de sesión del usuario.

## Seguridad

**RNF-05 Protección de Credenciales**
Las contraseñas de los usuarios deberán almacenarse mediante mecanismos de hash y no en texto plano.

**RNF-06 Control de Acceso**
Las funcionalidades del sistema deberán estar disponibles únicamente para usuarios autenticados. El JWT debe codificar el `accountant_id` y todo endpoint debe extraerlo del token, nunca de datos proporcionados por el usuario.

**RNF-07 Aislamiento de Información**
Cada contador únicamente podrá acceder a la información asociada a sus propios clientes. Todas las tablas de datos deben tener `accountant_id` como llave foránea. Toda consulta — ya sea de chat, dashboard o carga — debe aplicar un filtro obligatorio sobre `accountant_id` y `client_id`.

**RNF-08 Aislamiento por Cliente en Consultas SQL**
Las consultas SQL generadas por el LLM deben ejecutarse con los parámetros `accountant_id` y `client_id` inyectados por el backend. El LLM no puede controlar estos valores.

**RNF-09 Operaciones de Solo Lectura en Chat**
El sistema solo debe permitir consultas SQL de solo lectura en el contexto del chat. Las sentencias DML (INSERT, UPDATE, DELETE, DROP, ALTER) deben ser rechazadas sin ejecución.

## Internacionalización

**RNF-10 Interfaz en Español**
El frontend debe mostrar todo el texto al usuario en español (México). Las respuestas del asistente deben generarse en español.

**RNF-11 API en Inglés**
Los nombres de endpoints, campos JSON en las respuestas de la API y nombres de columnas en la base de datos deben estar en inglés.

## Inteligencia Artificial

**RNF-12 Conservación del Contexto Conversacional**
El sistema deberá utilizar el historial de mensajes de una conversación para interpretar consultas posteriores relacionadas. Todos los mensajes (usuario + asistente) se envían con cada solicitud dentro de los límites de tokens. Los más antiguos se recortan si se excede el límite.

**RNF-13 Consistencia del Contexto de Cliente**
Las respuestas generadas por el asistente deberán utilizar únicamente la información asociada al cliente seleccionado por el usuario.

**RNF-14 Trazabilidad de Hallazgos**
Todo insight almacenado deberá conservar la referencia del cliente, usuario y periodo que lo generó.

**RNF-15 Comprensibilidad de las Respuestas**
Las respuestas generadas por el asistente deberán presentarse en lenguaje natural orientado a profesionales de la contabilidad.

**RNF-16 No Utilización de Datos para Entrenamiento**
El sistema deberá utilizar únicamente proveedores de inteligencia artificial que garanticen contractualmente que la información enviada por los usuarios no será utilizada para el entrenamiento o mejora de modelos.

## Usabilidad

**RNF-17 Acceso a Funcionalidades Principales**
El usuario deberá poder acceder al Dashboard, Chat e Insights desde la vista principal de un cliente. La barra lateral con la lista de clientes y el selector de periodo deben permanecer visibles en todas las páginas.

## Privacidad y Protección de Datos

**RNF-18 Confidencialidad de la Información Financiera**
La información financiera procesada por el sistema deberá utilizarse exclusivamente para la generación de respuestas, análisis e insights solicitados por el usuario. Dicha información no deberá ser compartida con terceros distintos de los proveedores tecnológicos estrictamente necesarios para la operación del sistema.
