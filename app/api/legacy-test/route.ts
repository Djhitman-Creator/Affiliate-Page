import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

export async function GET(req: Request) {
  try {
    // Try to read the CSV file
    const csvPath = path.join(process.cwd(), "data", "Legacy_Track_Songbook.csv");
    const csvContent = await fs.readFile(csvPath, "utf-8");
    
    // Parse CSV - just get first 10 records for testing
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      max_record_size: 10
    });
    
    return NextResponse.json({
      success: true,
      message: "CSV reading works!",
      totalRecords: records.length,
      firstFew: records.slice(0, 5),
      csvFound: true
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Error reading CSV",
      error: error instanceof Error ? error.message : "Unknown error",
      csvFound: false
    });
  }
}