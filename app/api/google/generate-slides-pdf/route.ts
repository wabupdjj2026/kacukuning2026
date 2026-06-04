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

    const { templateId, nama, instruktur, namaKelas, noPeserta } = await req.json();

    if (!templateId) {
      return NextResponse.json(
        { error: 'ID Template Google Slides (templateId) diperlukan' },
        { status: 400 }
      );
    }

    if (!nama) {
      return NextResponse.json(
        { error: 'Nama penerima sertifikat (nama) diperlukan' },
        { status: 400 }
      );
    }

    // 1. Copy the Google Slides template to a temporary presentation
    // This creates a copy in the authenticated user's Google Drive.
    const copyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateId}/copy`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Sertifikat_${nama.replace(/\s+/g, '_')}_${(namaKelas || 'Kelas').replace(/\s+/g, '_')}`,
      }),
    });

    if (!copyResponse.ok) {
      const errText = await copyResponse.text();
      return NextResponse.json(
        { error: `Gagal menyalin/menduplikasi template Google Slides: ${errText}` },
        { status: copyResponse.status }
      );
    }

    const copyData = await copyResponse.json();
    const tempPresentationId = copyData.id;

    // 2. Perform Find-and-Replace substitutions via the Google Slides API
    // Replaces {{NAMA}}, {{INSTRUKTUR}}, {{KELAS}}, and {{NO_PESERTA}} with actual data.
    const replaceResponse = await fetch(
      `https://slides.googleapis.com/v1/presentations/${tempPresentationId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              replaceAllText: {
                containsText: {
                  text: '{{NAMA}}',
                  matchCase: true,
                },
                replaceText: nama,
              },
            },
            {
              replaceAllText: {
                containsText: {
                  text: '{{INSTRUKTUR}}',
                  matchCase: true,
                },
                replaceText: instruktur || 'Instruktur Kelas',
              },
            },
            {
              replaceAllText: {
                containsText: {
                  text: '{{KELAS}}',
                  matchCase: true,
                },
                replaceText: namaKelas || '',
              },
            },
            {
              replaceAllText: {
                containsText: {
                  text: '{{NO_PESERTA}}',
                  matchCase: true,
                },
                replaceText: noPeserta || '',
              },
            },
          ],
        }),
      }
    );

    if (!replaceResponse.ok) {
      const errText = await replaceResponse.text();
      // Clean up the temporary copy if substitution fails
      await fetch(`https://www.googleapis.com/drive/v3/files/${tempPresentationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': authHeader },
      });
      return NextResponse.json(
        { error: `Gagal melakukan penggantian variabel teks di Slide: ${errText}` },
        { status: replaceResponse.status }
      );
    }

    // 3. Export the processed Google Slides presentation as a PDF
    const exportResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${tempPresentationId}/export?mimeType=application/pdf`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
        },
      }
    );

    if (!exportResponse.ok) {
      const errText = await exportResponse.text();
      // Clean up the temporary copy
      await fetch(`https://www.googleapis.com/drive/v3/files/${tempPresentationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': authHeader },
      });
      return NextResponse.json(
        { error: `Gagal mengekspor hasil ke formato PDF: ${errText}` },
        { status: exportResponse.status }
      );
    }

    const pdfBuffer = await exportResponse.arrayBuffer();

    // 4. Clean up the temporary Google Slide duplicate from user's Drive so it doesn't leave clutter
    await fetch(`https://www.googleapis.com/drive/v3/files/${tempPresentationId}`, {
      method: 'DELETE',
      headers: { 'Authorization': authHeader },
    });

    // 5. Send PDF binary response back to client for download
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Sertifikat_${nama.replace(/\s+/g, '_')}.pdf"`,
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan sistem internal server' },
      { status: 500 }
    );
  }
}
