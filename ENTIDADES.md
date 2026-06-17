# Entidades de Dominio

## Contador
Contador freelancer que usa el sistema para gestionar multiples clientes.

- id
- email
- password_hash
- nombre

## Cliente
Empresa cliente del contador. Sus datos financieros se analizan en el sistema.

- id
- contador_id
- nombre_comercial
- razon_social
- rfc
- industria

## Periodo
Unidad de tiempo mensual para agrupar datos financieros.

- id (ej. "2024-01")
- año
- mes
- etiqueta (ej. "Enero 2024")

## Venta
Transacción de venta de un producto o servicio.

- id
- contador_id
- cliente_id
- periodo_id
- fecha
- cliente_nombre
- producto
- cantidad
- precio_unitario
- monto_neto
- iva
- monto_total

## Gasto
Registro de gasto o costo operativo.

- id
- contador_id
- cliente_id
- periodo_id
- fecha
- categoria
- descripcion
- monto
- iva

## Nomina
Registro de pago de nómina a un empleado.

- id
- contador_id
- cliente_id
- periodo_id
- empleado
- puesto
- salario_bruto
- deducciones
- salario_neto
- isr
- imss

## Producto
Producto o servicio con precio y costo, asociado a un periodo.

- id
- contador_id
- cliente_id
- periodo_id
- nombre
- categoria
- precio_unitario
- costo_unitario

## Conversacion
Conversación entre el contador y el asistente IA para un cliente.

- id
- contador_id
- cliente_id
- fecha_creacion

## Mensaje
Mensaje individual dentro de una conversación. Puede ser del usuario o del asistente.

- id
- conversacion_id
- rol (usuario / asistente)
- contenido
- config_grafica (JSON, solo respuestas del asistente)
- fecha

## Insight
Hallazgo o análisis guardado por el contador a partir de una respuesta del asistente.

- id
- contador_id
- cliente_id
- periodo_id
- pregunta
- respuesta_texto
- config_grafica
- es_actualizable
- fecha_creacion
