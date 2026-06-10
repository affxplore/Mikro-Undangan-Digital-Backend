// Mapping untuk field-field penting dari form ke data template
export const COVER_TYPES = {
    wedding: {
        preTitle: 'name',
        brideName: 'owner_1',
        groomName: 'owner_2',
        date: 'tanggal',
        venue: 'lokasi'
    },
    birthday: {
        preTitle: 'name',
        celebrantName: 'owner_1',
        parentNames: 'owner_2',
        date: 'tanggal',
        venue: 'lokasi'
    },
    graduation: {
        preTitle: 'name',
        graduateName: 'owner_1',
        parentNames: 'owner_2',  // Diubah ke nama orangtua
        date: 'tanggal',
        venue: 'lokasi'
    },
    christmas: {
        preTitle: 'name',
        hostName: 'owner_1',
        coHostName: 'owner_2',   // Diubah ke nama co-host
        date: 'tanggal',
        venue: 'lokasi'
    },
    aqiqah: {
        preTitle: 'name',
        childName: 'owner_1',
        parentNames: 'owner_2',
        date: 'tanggal',
        venue: 'lokasi'
    },
    syukuran: {
        preTitle: 'name',
        hostName: 'owner_1',
        reason: 'owner_2',
        date: 'tanggal',
        venue: 'lokasi'
    },
    meeting: {
        preTitle: 'name',
        chairmanName: 'owner_1',   // Nama ketua/pemimpin rapat
        coChairName: 'owner_2',    // Nama wakil ketua/co-host
        date: 'tanggal',
        venue: 'lokasi'
    },
    seminar: {
        preTitle: 'name',
        speakerName: 'owner_1',    // Nama pembicara utama
        moderatorName: 'owner_2',  // Nama moderator
        date: 'tanggal',
        venue: 'lokasi'
    },
    'grand opening': {
        preTitle: 'name',
        storeName: 'owner_1',
        tagline: 'owner_2',
        date: 'tanggal',
        venue: 'lokasi'
    },
    arisan: {
        preTitle: 'name',
        groupName: 'owner_1',
        hostName: 'owner_2',
        date: 'tanggal',
        venue: 'lokasi'
    },
    khitanan: {
        preTitle: 'name',
        childName: 'owner_1',
        parentNames: 'owner_2',
        date: 'tanggal',
        venue: 'lokasi'
    },
    party: {
        preTitle: 'name',
        hostName: 'owner_1',    // Nama host/penyelenggara pesta
        coHostName: 'owner_2',  // Nama co-host/penyelenggara kedua (opsional)
        date: 'tanggal',
        venue: 'lokasi'
    },
    // Default mapping untuk kategori yang tidak terdaftar
    default: {
        preTitle: 'name',
        ownerName: 'owner_1',     // Nama penyelenggara utama
        coOwnerName: 'owner_2',   // Nama penyelenggara kedua
        date: 'tanggal',
        venue: 'lokasi'
    }
};