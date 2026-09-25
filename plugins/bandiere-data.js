const bandiere = [
    {
        flag: '🇮🇹',
        options: ['Italia', 'Francia', 'Spagna', 'Grecia'],
        answer: 0
    },
    {
        flag: '🇫🇷',
        options: ['Belgio', 'Francia', 'Paesi Bassi', 'Lussemburgo'],
        answer: 1
    },
    {
        flag: '🇩🇪',
        options: ['Austria', 'Germania', 'Polonia', 'Svizzera'],
        answer: 1
    },
    {
        flag: '🇪🇸',
        options: ['Portogallo', 'Spagna', 'Messico', 'Cile'],
        answer: 1
    },
    {
        flag: '🇵🇹',
        options: ['Portogallo', 'Brasile', 'Spagna', 'Italia'],
        answer: 0
    },
    {
        flag: '🇬🇧',
        options: ['Australia', 'Regno Unito', 'Nuova Zelanda', 'Irlanda'],
        answer: 1
    },
    {
        flag: '🇮🇪',
        options: ['Irlanda', 'Islanda', 'India', 'Costa d’Avorio'],
        answer: 0
    },
    {
        flag: '🇺🇸',
        options: ['Liberia', 'Stati Uniti', 'Cuba', 'Australia'],
        answer: 1
    },
    {
        flag: '🇨🇦',
        options: ['Canada', 'Austria', 'Danimarca', 'Svizzera'],
        answer: 0
    },
    {
        flag: '🇧🇷',
        options: ['Brasile', 'Argentina', 'Bolivia', 'Colombia'],
        answer: 0
    },
    {
        flag: '🇦🇷',
        options: ['Uruguay', 'Argentina', 'Paraguay', 'Cile'],
        answer: 1
    },
    {
        flag: '🇲🇽',
        options: ['Messico', 'Italia', 'Cile', 'Perù'],
        answer: 0
    },
    {
        flag: '🇯🇵',
        options: ['Cina', 'Giappone', 'Corea del Sud', 'Vietnam'],
        answer: 1
    },
    {
        flag: '🇨🇳',
        options: ['Cina', 'Vietnam', 'Mongolia', 'Corea del Nord'],
        answer: 0
    },
    {
        flag: '🇰🇷',
        options: ['Corea del Sud', 'Corea del Nord', 'Giappone', 'Singapore'],
        answer: 0
    },
    {
        flag: '🇮🇳',
        options: ['India', 'Niger', 'Irlanda', 'Costa d’Avorio'],
        answer: 0
    },
    {
        flag: '🇦🇺',
        options: ['Nuova Zelanda', 'Australia', 'Regno Unito', 'Figi'],
        answer: 1
    },
    {
        flag: '🇳🇿',
        options: ['Australia', 'Nuova Zelanda', 'Islanda', 'Figi'],
        answer: 1
    },
    {
        flag: '🇿🇦',
        options: ['Sudafrica', 'Kenya', 'Namibia', 'Botswana'],
        answer: 0
    },
    {
        flag: '🇪🇬',
        options: ['Egitto', 'Siria', 'Iraq', 'Yemen'],
        answer: 0
    },
    {
        flag: '🇹🇷',
        options: ['Tunisia', 'Turchia', 'Pakistan', 'Albania'],
        answer: 1
    },
    {
        flag: '🇬🇷',
        options: ['Grecia', 'Uruguay', 'Israele', 'Finlandia'],
        answer: 0
    },
    {
        flag: '🇳🇱',
        options: ['Paesi Bassi', 'Lussemburgo', 'Francia', 'Russia'],
        answer: 0
    },
    {
        flag: '🇧🇪',
        options: ['Belgio', 'Germania', 'Romania', 'Bulgaria'],
        answer: 0
    },
    {
        flag: '🇨🇭',
        options: ['Svizzera', 'Danimarca', 'Austria', 'Georgia'],
        answer: 0
    },
    {
        flag: '🇦🇹',
        options: ['Austria', 'Lettonia', 'Polonia', 'Ungheria'],
        answer: 0
    },
    {
        flag: '🇵🇱',
        options: ['Polonia', 'Indonesia', 'Monaco', 'Singapore'],
        answer: 0
    },
    {
        flag: '🇨🇿',
        options: ['Slovacchia', 'Repubblica Ceca', 'Slovenia', 'Croazia'],
        answer: 1
    },
    {
        flag: '🇭🇺',
        options: ['Ungheria', 'Bulgaria', 'Italia', 'Iran'],
        answer: 0
    },
    {
        flag: '🇷🇴',
        options: ['Romania', 'Ciad', 'Moldavia', 'Andorra'],
        answer: 0
    },
    {
        flag: '🇧🇬',
        options: ['Bulgaria', 'Ungheria', 'Lituania', 'Slovacchia'],
        answer: 0
    },
    {
        flag: '🇭🇷',
        options: ['Croazia', 'Slovenia', 'Serbia', 'Slovacchia'],
        answer: 0
    },
    {
        flag: '🇷🇸',
        options: ['Serbia', 'Croazia', 'Montenegro', 'Slovenia'],
        answer: 0
    },
    {
        flag: '🇸🇮',
        options: ['Slovenia', 'Slovacchia', 'Serbia', 'Croazia'],
        answer: 0
    },
    {
        flag: '🇸🇰',
        options: ['Slovacchia', 'Slovenia', 'Repubblica Ceca', 'Croazia'],
        answer: 0
    },
    {
        flag: '🇺🇦',
        options: ['Ucraina', 'Svezia', 'Kazakhstan', 'Estonia'],
        answer: 0
    },
    {
        flag: '🇷🇺',
        options: ['Russia', 'Serbia', 'Slovacchia', 'Slovenia'],
        answer: 0
    },
    {
        flag: '🇳🇴',
        options: ['Norvegia', 'Islanda', 'Danimarca', 'Finlandia'],
        answer: 0
    },
    {
        flag: '🇸🇪',
        options: ['Svezia', 'Finlandia', 'Islanda', 'Norvegia'],
        answer: 0
    },
    {
        flag: '🇫🇮',
        options: ['Finlandia', 'Grecia', 'Islanda', 'Svezia'],
        answer: 0
    },
    {
        flag: '🇩🇰',
        options: ['Danimarca', 'Norvegia', 'Islanda', 'Svezia'],
        answer: 0
    },
    {
        flag: '🇮🇸',
        options: ['Islanda', 'Norvegia', 'Finlandia', 'Danimarca'],
        answer: 0
    },
    {
        flag: '🇨🇺',
        options: ['Cuba', 'Porto Rico', 'Repubblica Dominicana', 'Costa Rica'],
        answer: 0
    },
    {
        flag: '🇨🇱',
        options: ['Cile', 'Texas', 'Liberia', 'Cuba'],
        answer: 0
    },
    {
        flag: '🇵🇪',
        options: ['Perù', 'Austria', 'Canada', 'Polonia'],
        answer: 0
    },
    {
        flag: '🇨🇴',
        options: ['Colombia', 'Ecuador', 'Venezuela', 'Bolivia'],
        answer: 0
    },
    {
        flag: '🇻🇪',
        options: ['Venezuela', 'Colombia', 'Ecuador', 'Bolivia'],
        answer: 0
    },
    {
        flag: '🇺🇾',
        options: ['Uruguay', 'Argentina', 'Paraguay', 'Cile'],
        answer: 0
    },
    {
        flag: '🇵🇾',
        options: ['Paraguay', 'Uruguay', 'Bolivia', 'Argentina'],
        answer: 0
    },
    {
        flag: '🇧🇴',
        options: ['Bolivia', 'Perù', 'Ecuador', 'Paraguay'],
        answer: 0
    },
    {
        flag: '🇪🇨',
        options: ['Ecuador', 'Colombia', 'Venezuela', 'Bolivia'],
        answer: 0
    },
    {
        flag: '🇨🇷',
        options: ['Costa Rica', 'Panama', 'Nicaragua', 'Honduras'],
        answer: 0
    },
    {
        flag: '🇵🇦',
        options: ['Panama', 'Costa Rica', 'Cuba', 'Guatemala'],
        answer: 0
    },
    {
        flag: '🇯🇲',
        options: ['Giamaica', 'Kenya', 'Ghana', 'Sudafrica'],
        answer: 0
    },
    {
        flag: '🇰🇪',
        options: ['Kenya', 'Ghana', 'Uganda', 'Tanzania'],
        answer: 0
    },
    {
        flag: '🇬🇭',
        options: ['Ghana', 'Guinea', 'Senegal', 'Nigeria'],
        answer: 0
    },
    {
        flag: '🇳🇬',
        options: ['Nigeria', 'Niger', 'Ghana', 'Kenya'],
        answer: 0
    },
    {
        flag: '🇲🇦',
        options: ['Marocco', 'Tunisia', 'Algeria', 'Egitto'],
        answer: 0
    },
    {
        flag: '🇩🇿',
        options: ['Algeria', 'Marocco', 'Tunisia', 'Libia'],
        answer: 0
    },
    {
        flag: '🇹🇳',
        options: ['Tunisia', 'Turchia', 'Marocco', 'Algeria'],
        answer: 0
    },
    {
        flag: '🇸🇦',
        options: ['Arabia Saudita', 'Pakistan', 'Iran', 'Iraq'],
        answer: 0
    },
    {
        flag: '🇦🇪',
        options: ['Emirati Arabi Uniti', 'Qatar', 'Kuwait', 'Oman'],
        answer: 0
    },
    {
        flag: '🇶🇦',
        options: ['Qatar', 'Bahrain', 'Kuwait', 'Emirati Arabi Uniti'],
        answer: 0
    },
    {
        flag: '🇮🇱',
        options: ['Israele', 'Grecia', 'Argentina', 'Cipro'],
        answer: 0
    },
    {
        flag: '🇮🇷',
        options: ['Iran', 'Iraq', 'Pakistan', 'Afghanistan'],
        answer: 0
    },
    {
        flag: '🇮🇶',
        options: ['Iraq', 'Iran', 'Kuwait', 'Siria'],
        answer: 0
    },
    {
        flag: '🇵🇰',
        options: ['Pakistan', 'India', 'Bangladesh', 'Afghanistan'],
        answer: 0
    },
    {
        flag: '🇹🇭',
        options: ['Thailandia', 'Costa Rica', 'Cambogia', 'Laos'],
        answer: 0
    },
    {
        flag: '🇻🇳',
        options: ['Vietnam', 'Cina', 'Laos', 'Cambogia'],
        answer: 0
    },
    {
        flag: '🇵🇭',
        options: ['Filippine', 'Indonesia', 'Malesia', 'Thailandia'],
        answer: 0
    },
    {
        flag: '🇮🇩',
        options: ['Indonesia', 'Monaco', 'Polonia', 'Singapore'],
        answer: 0
    },
    {
        flag: '🇲🇾',
        options: ['Malesia', 'Liberia', 'Indonesia', 'Brunei'],
        answer: 0
    },
    {
        flag: '🇸🇬',
        options: ['Singapore', 'Indonesia', 'Monaco', 'Malesia'],
        answer: 0
    },
    {
        flag: '🇳🇵',
        options: ['Nepal', 'Bhutan', 'India', 'Bangladesh'],
        answer: 0
    },
    {
        flag: '🇧🇩',
        options: ['Bangladesh', 'Pakistan', 'India', 'Nepal'],
        answer: 0
    },
    {
        flag: '🇱🇰',
        options: ['Sri Lanka', 'India', 'Nepal', 'Bhutan'],
        answer: 0
    },
    {
        flag: '🇲🇳',
        options: ['Mongolia', 'Kazakhstan', 'Cina', 'Kyrgyzstan'],
        answer: 0
    },
    {
        flag: '🇰🇿',
        options: ['Kazakhstan', 'Uzbekistan', 'Mongolia', 'Kirghizistan'],
        answer: 0
    },
    {
        flag: '🇺🇿',
        options: ['Uzbekistan', 'Kazakhstan', 'Turkmenistan', 'Tagikistan'],
        answer: 0
    },
    {
        flag: '🇦🇫',
        options: ['Afghanistan', 'Pakistan', 'Iran', 'Tagikistan'],
        answer: 0
    },
    {
        flag: '🇫🇯',
        options: ['Figi', 'Australia', 'Nuova Zelanda', 'Samoa'],
        answer: 0
    },
    {
        flag: '🇼🇸',
        options: ['Samoa', 'Tonga', 'Figi', 'Tuvalu'],
        answer: 0
    },
    {
        flag: '🇹🇴',
        options: ['Tonga', 'Samoa', 'Figi', 'Nuova Zelanda'],
        answer: 0
    },
    {
        flag: '🇻🇦',
        options: ['Città del Vaticano', 'Italia', 'San Marino', 'Monaco'],
        answer: 0
    },
    {
        flag: '🇸🇲',
        options: ['San Marino', 'Italia', 'Vaticano', 'Andorra'],
        answer: 0
    },
    {
        flag: '🇦🇩',
        options: ['Andorra', 'Monaco', 'San Marino', 'Liechtenstein'],
        answer: 0
    },
    {
        flag: '🇲🇨',
        options: ['Monaco', 'Indonesia', 'Polonia', 'Singapore'],
        answer: 0
    },
    {
        flag: '🇱🇺',
        options: ['Lussemburgo', 'Paesi Bassi', 'Francia', 'Belgio'],
        answer: 0
    },
    {
        flag: '🇱🇮',
        options: ['Liechtenstein', 'Lussemburgo', 'Svizzera', 'Austria'],
        answer: 0
    },
    {
        flag: '🇪🇪',
        options: ['Estonia', 'Lettonia', 'Lituania', 'Finlandia'],
        answer: 0
    },
    {
        flag: '🇱🇻',
        options: ['Lettonia', 'Estonia', 'Lituania', 'Polonia'],
        answer: 0
    },
    {
        flag: '🇱🇹',
        options: ['Lituania', 'Lettonia', 'Estonia', 'Polonia'],
        answer: 0
    },
    {
        flag: '🇲🇩',
        options: ['Moldavia', 'Romania', 'Ucraina', 'Bulgaria'],
        answer: 0
    },
    {
        flag: '🇧🇾',
        options: ['Bielorussia', 'Russia', 'Ucraina', 'Lituania'],
        answer: 0
    },
    {
        flag: '🇬🇪',
        options: ['Georgia', 'Inghilterra', 'Svizzera', 'Turchia'],
        answer: 0
    },
    {
        flag: '🇦🇲',
        options: ['Armenia', 'Azerbaigian', 'Georgia', 'Turchia'],
        answer: 0
    },
    {
        flag: '🇦🇿',
        options: ['Azerbaigian', 'Armenia', 'Georgia', 'Kazakhstan'],
        answer: 0
    }
]

export default bandiere