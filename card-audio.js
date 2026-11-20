export function validateAudioFile(file){
 if(!['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/ogg'].includes(file.type))throw Error('Выберите аудио в формате MP3, WAV или OGG.');
 if(!file.size||file.size>2*1024*1024)throw Error('Аудиофайл должен быть непустым и не больше 2 МБ.');
}
