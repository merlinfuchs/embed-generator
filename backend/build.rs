use std::path::Path;
use std::{env, fs};

use regex::Regex;

fn parse_emoji_list(resp: String) -> Vec<(String, String, String)> {
    let mut emojis = Vec::new();

    let sequence_re =
        Regex::new(r"([A-Z0-9 ]+)\s+;\s+[a-zA-Z_]+\s+;\s+([a-zA-Z0-9-_,: ]+).+\n").unwrap();

    for line in sequence_re.captures_iter(&resp) {
        let (raw, name) = (
            line.get(1).unwrap().as_str().trim(),
            line.get(2).unwrap().as_str().trim(),
        );
        let sequence: String = raw
            .split(' ')
            .map(|v| v.to_string().to_lowercase())
            .collect::<Vec<String>>()
            .join("-");
        let unicode: String = raw
            .split(' ')
            .map(|v| {
                char::from_u32(u32::from_str_radix(v, 16).unwrap())
                    .unwrap()
                    .to_string()
            })
            .collect::<Vec<String>>()
            .join("");
        emojis.push((unicode, sequence, name.to_string()));
    }

    let range_re =
        Regex::new(r"([A-Z0-9]+)\.\.([A-Z0-9]+)\s+;\s+[a-zA-Z_]+\s+;\s+([a-zA-Z0-9-_ ]+).+\n")
            .unwrap();
    for line in range_re.captures_iter(&resp) {
        let (raw_start, raw_end, name) = (
            line.get(1).unwrap().as_str().trim(),
            line.get(2).unwrap().as_str().trim(),
            line.get(3).unwrap().as_str().trim(),
        );
        let start = char::from_u32(u32::from_str_radix(raw_start, 16).unwrap()).unwrap();
        let end = char::from_u32(u32::from_str_radix(raw_end, 16).unwrap()).unwrap();
        for char in start..=end {
            let sequence = format!("{:x}", char as u32);
            emojis.push((char.to_string(), sequence, name.to_string()));
        }
    }

    emojis
}

fn download_unicode_emojis() -> Vec<(String, String, String)> {
    let resp = ureq::get("https://unicode.org/Public/emoji/13.1/emoji-sequences.txt")
        .call()
        .expect("Downloading unicode sequences")
        .into_string()
        .expect("Decoding unicode sequences");

    let mut emojis = parse_emoji_list(resp);

    let resp = ureq::get("https://unicode.org/Public/emoji/13.1/emoji-zwj-sequences.txt")
        .call()
        .expect("Downloading unicode sequences")
        .into_string()
        .expect("Decoding unicode sequences");

    emojis.extend_from_slice(&parse_emoji_list(resp));

    emojis
}

fn main() {
    println!("cargo:rerun-if-changed=build.rs");
    let emojis = download_unicode_emojis();

    let out_dir = env::var_os("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("emojis.rs");
    fs::write(&dest_path, format!("&{:?}", emojis)).unwrap();
}
