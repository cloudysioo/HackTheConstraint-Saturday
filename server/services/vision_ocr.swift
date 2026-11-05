import Foundation
import Vision
import Cocoa

struct BoundingBox: Codable {
    let top: Double
    let left: Double
    let width: Double
    let height: Double
}

struct OCRLine: Codable {
    let text: String
    let confidence: Double
    let bbox: BoundingBox
}

struct OCRResponse: Codable {
    let fullText: String
    let lines: [OCRLine]
}

guard CommandLine.arguments.count > 1 else {
    fputs("Usage: vision_ocr <image_path>\n", stderr)
    exit(1)
}

let imagePath = CommandLine.arguments[1]
let fileURL = URL(fileURLWithPath: imagePath)

guard let image = NSImage(contentsOf: fileURL),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    fputs("Error: Could not load image from \(imagePath)\n", stderr)
    exit(1)
}

var lines: [OCRLine] = []
var textSegments: [String] = []

let request = VNRecognizeTextRequest { (request, error) in
    if let error = error {
        fputs("Vision OCR Error: \(error.localizedDescription)\n", stderr)
        return
    }

    guard let observations = request.results as? [VNRecognizedTextObservation] else { return }

    for obs in observations {
        guard let candidate = obs.topCandidates(1).first else { continue }
        let text = candidate.string.trimmingCharacters(in: .whitespacesAndNewlines)
        if text.isEmpty { continue }

        let box = obs.boundingBox
        // Convert Vision bottom-left coordinates to web standard top-left percentages
        let topPct = (1.0 - box.origin.y - box.size.height) * 100.0
        let leftPct = box.origin.x * 100.0
        let widthPct = box.size.width * 100.0
        let heightPct = box.size.height * 100.0

        let line = OCRLine(
            text: text,
            confidence: Double(candidate.confidence * 100.0),
            bbox: BoundingBox(
                top: max(0.0, min(100.0, topPct)),
                left: max(0.0, min(100.0, leftPct)),
                width: max(1.0, min(100.0, widthPct)),
                height: max(1.0, min(100.0, heightPct))
            )
        )
        lines.append(line)
        textSegments.append(text)
    }
}

// Enable Apple Vision Handwriting & Deep Learning Neural Engine recognition
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.customWords = [
    "Dolo", "Citrigen", "Cetirizine", "Paracetamol", "Crocin", "Calpol",
    "Metformin", "Glycomet", "Augmentin", "Azithral", "Pantocid", "Pantoprazole",
    "Omeprazole", "Omez", "Telma", "Telmisartan", "Amlodipine", "Atorvastatin",
    "Rosuvastatin", "Combiflam", "Meftal", "Shelcal", "Zincovit", "Limcee",
    "Montelukast", "Levocetirizine", "1-0-1", "1-1-1", "0-1-0", "0-0-1", "1-0-0",
    "SOS", "BD", "TDS", "OD", "HS", "AC", "PC", "mg", "tab", "cap", "syr",
    "Dose", "unclear", "daily", "bedtime", "meals", "tablet", "morning"
]

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
    let fullText = textSegments.joined(separator: "\n")
    let response = OCRResponse(fullText: fullText, lines: lines)
    let encoder = JSONEncoder()
    encoder.outputFormatting = .prettyPrinted
    let jsonData = try encoder.encode(response)
    if let jsonString = String(data: jsonData, encoding: .utf8) {
        print(jsonString)
    }
} catch {
    fputs("Handler Error: \(error.localizedDescription)\n", stderr)
    exit(1)
}
