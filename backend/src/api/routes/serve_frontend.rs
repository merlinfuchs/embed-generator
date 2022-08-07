use std::borrow::Cow;
use std::path::Path;

use actix_web::web::Bytes;
use actix_web::{get, web, HttpResponse, Responder};
use mime::Mime;
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "../frontend/build"]
struct FrontendFiles;

fn get_mime_type_for_file(path: &Path) -> Mime {
    match path.extension().and_then(|v| v.to_str()) {
        Some(v) => match v {
            "html" => mime::TEXT_HTML,
            "js" => mime::APPLICATION_JAVASCRIPT,
            "png" => mime::IMAGE_PNG,
            "css" => mime::TEXT_CSS,
            "svg" => mime::IMAGE_SVG,
            _ => mime::APPLICATION_OCTET_STREAM,
        },
        None => mime::APPLICATION_OCTET_STREAM,
    }
}

fn cow_to_bytes(cow: Cow<'static, [u8]>) -> Bytes {
    match cow {
        Cow::Borrowed(bytes) => bytes.into(),
        Cow::Owned(bytes) => bytes.into(),
    }
}

#[get("/{path:.*}")]
pub async fn route_serve_frontend(path: web::Path<String>) -> impl Responder {
    let raw_path = path.into_inner();
    let path = Path::new(&raw_path);

    let (body, mime_type) = match FrontendFiles::get(raw_path.as_str()) {
        Some(f) => (cow_to_bytes(f.data), get_mime_type_for_file(path)),
        None => (
            cow_to_bytes(FrontendFiles::get("index.html").unwrap().data),
            mime::TEXT_HTML,
        ),
    };

    HttpResponse::Ok()
        .append_header(("Content-Type", mime_type))
        .body(body)
}
