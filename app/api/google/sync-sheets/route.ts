import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Token otentikasi Google Access Token diperlukan di header Authorization' },
        { status: 401 }
      );
    }

    const { sheetId, classes, participants, sirkulasi, questions } = await req.json();

    let targetSheetId = sheetId;

    // 1. If sheetId is empty, create a new Google Spreadsheet
    if (!targetSheetId) {
      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: 'Sistem Kelas Kepahaman - Cloud Sync Backup',
          },
        }),
      });

      if (!createResponse.ok) {
        const errText = await createResponse.text();
        return NextResponse.json(
          { error: `Gagal membuat spreadsheet Google Sheets baru: ${errText}` },
          { status: createResponse.status }
        );
      }

      const createData = await createResponse.json();
      targetSheetId = createData.spreadsheetId;
    }

    // 2. Load spreadsheet metadata to inspect which tabs exist
    const metaResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${targetSheetId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!metaResponse.ok) {
      const errText = await metaResponse.text();
      return NextResponse.json(
        { error: `Gagal membaca informasi Google Spreadsheet dengan ID ${targetSheetId}: ${errText}. Pastikan ID valid dan Anda memiliki akses.` },
        { status: metaResponse.status }
      );
    }

    const metaData = await metaResponse.json();
    const existingTitles = new Set(
      (metaData.sheets || []).map((sheet: any) => sheet.properties?.title).filter(Boolean)
    );

    const requiredSheets = ['Daftar_Kelas', 'Daftar_Peserta', 'Laporan_Sirkulasi', 'Pertanyaan_Siswa'];
    const sheetsToCreate = requiredSheets.filter(title => !existingTitles.has(title));

    // 3. Create missing tabs if any
    if (sheetsToCreate.length > 0) {
      const batchUpdateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${targetSheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: sheetsToCreate.map(title => ({
            addSheet: {
              properties: {
                title,
              },
            },
          })),
        }),
      });

      if (!batchUpdateResponse.ok) {
        const errText = await batchUpdateResponse.text();
        return NextResponse.json(
          { error: `Gagal membuat tab baru di Google Sheets: ${errText}` },
          { status: batchUpdateResponse.status }
        );
      }
    }

    // 4. Clear existing data in the sheets to ensure a clean sync (avoid dangling old records)
    for (const title of requiredSheets) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${targetSheetId}/values/${title}!A1:Z5000:clear`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        },
      });
    }

    // 5. Structure updated rows
    const classesRows = (classes || []).map((item: any) => [
      item.id_kelas || '',
      item.nama_kelas || '',
      item.instruktur || '',
      item.deskripsi || '',
      item.kategori || '',
    ]);

    const participantsRows = (participants || []).map((item: any) => [
      item.username || '',
      item.password || '',
      item.nama_lengkap || '',
      item.no_peserta || '',
      item.Nama_Klub || '',
      item.Nama_Jemaat || '',
    ]);

    const sirkulasiRows = (sirkulasi || []).map((item: any) => [
      item.id_transaksi || '',
      item.no_peserta || '',
      item.id_kelas || '',
      item.Kelas_mulai || '',
      item.Kelas_Selesai || '',
      item.status || '',
      item.Instruktur || '',
      item.catatan_instruktur || '',
      item.link_sertifikat || '',
    ]);

    const questionsRows = (questions || []).map((item: any) => [
      item.id_pertanyaan || '',
      item.no_peserta || '',
      item.nama_lengkap || '',
      item.judul || '',
      item.isi || '',
      item.tanggal_kirim || '',
      item.status || '',
      item.jawaban || '',
      item.tanggal_dijawab || '',
    ]);

    // 6. Write values to sheets via batchUpdate
    const writeResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${targetSheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'Daftar_Kelas!A1',
            values: [
              ['ID Kelas', 'Nama Kelas', 'Instruktur', 'Deskripsi', 'Kategori'],
              ...classesRows
            ]
          },
          {
            range: 'Daftar_Peserta!A1',
            values: [
              ['Username', 'Password', 'Nama Lengkap', 'No Peserta', 'Nama Klub', 'Nama Jemaat'],
              ...participantsRows
            ]
          },
          {
            range: 'Laporan_Sirkulasi!A1',
            values: [
              ['ID Transaksi', 'No Peserta', 'ID Kelas', 'Kelas Mulai', 'Kelas Selesai', 'Status', 'Instruktur', 'Catatan Instruktur', 'Link Sertifikat'],
              ...sirkulasiRows
            ]
          },
          {
            range: 'Pertanyaan_Siswa!A1',
            values: [
              ['ID Pertanyaan', 'No Peserta', 'Nama Lengkap', 'Judul', 'Isi', 'Tanggal Kirim', 'Status', 'Jawaban', 'Tanggal Dijawab'],
              ...questionsRows
            ]
          }
        ]
      }),
    });

    if (!writeResponse.ok) {
      const errText = await writeResponse.text();
      return NextResponse.json(
        { error: `Gagal menulis data ke spreadsheet: ${errText}` },
        { status: writeResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      sheetId: targetSheetId,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem internal server' },
      { status: 500 }
    );
  }
}
