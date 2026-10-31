# Generador de catálogos para WhatsApp

[English](README.md) · **Español**

Genera **catálogos PDF listos para imprimir donde cada foto es un botón de WhatsApp**: al tocar un producto se abre el chat con el vendedor y un mensaje ya escrito que nombra ese producto.

Hecho para mueblerías pequeñas de Colombia que venden por WhatsApp e Instagram. Se ha usado para entregar catálogos reales a varios clientes; este repositorio contiene el generador con una marca ficticia ("Muebles Demo") y fotos de dominio público.

**[Descarga el PDF de ejemplo](https://github.com/cuajada69/whatsapp-catalog-generator/releases/download/v1.0.0/muebles-demo-catalog.pdf)** y toca cualquier foto para probar los enlaces.

## Qué hace

- **Un solo archivo JSON lo controla todo**: marca, número de WhatsApp, redes, secciones, productos, fotos y todos los textos visibles (el catálogo puede ir en cualquier idioma).
- **PDF con enlaces**: cada foto, pie de página y llamado a la acción abre `api.whatsapp.com/send` con un mensaje por producto; el índice lleva a cada página.
- **Verificación automática** después de generar: todas las imágenes cargan, cada imagen es un enlace a WhatsApp, ninguna página se desborda y los enlaces dentro del PDF coinciden exactamente con los esperados.
- **El mismo HTML sirve dos veces**: páginas A4 para el PDF y una columna cuando se abre en el celular.
- Las fotos se redimensionan y comprimen con `sharp` y **nunca se recortan** (el producto se ve completo).
- Validación de la configuración con errores claros (fotos faltantes, códigos repetidos, números mal escritos).

## Uso rápido

Necesitas Node.js 22.13+ y Chrome, Edge o Chromium instalado.

```bash
npm install
npm run catalog        # genera dist/catalog.html y dist/catalog.pdf, y lo verifica
npm test               # pruebas unitarias
```

Si no detecta el navegador, pon su ruta en la variable `BROWSER_PATH`.

## Configuración

Edita `catalog.json`. Las fotos se buscan como `photos/<id>.jpg`, y el mensaje acepta `{name}`, `{code}` y cualquier otro campo del producto. Los detalles completos están en el [README en inglés](README.md#configuration).

## Lo que viene

Mira el [ROADMAP.md](ROADMAP.md): herramienta de línea de comandos en npm, más diseños, precios, código QR, importar desde Excel/CSV y exportar como página web.

## Licencia

MIT
