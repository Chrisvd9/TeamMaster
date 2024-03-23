import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAvatarZip } from '../../queries/images';
import { useGenerateScoreSheet } from '../../queries/groups';


const PersonTable = ({ wcif, events, groupsByEvent }) => {

    const [editedGroups, setEditedGroups] = useState({});
    const [showWcaId, setShowWcaId] = useState(true);
    const [languageScoreSheet, setLanguageScoreSheet] = useState('es');
    const [filterName, setFilterName] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
    const [urlZip, setUrlZip] = useState('');
    const [urlScoreSheet, setUrlScoreSheet] = useState('');
    const [urlEmptyScoreSheet, setUrlEmptyScoreSheet] = useState('');

    const mutateGenerateScoreSheet = useGenerateScoreSheet();
    const mutateAvatarZip = useAvatarZip();

    const { t } = useTranslation('global');


    const handleInputChange = (personName, eventId, value) => {

        // let intValue = parseInt(value);

        if (value === '') {
            value = undefined;
        }
        if (value < 1) {
            value = 1;
        }

        if (value > groupsByEvent[eventId]) {
            value = groupsByEvent[eventId];
        }


        setEditedGroups(prevState => ({
            ...prevState,
            [`${personName}-${eventId}`]: value
        }));
        updateWCIF(personName, eventId, value);
    }

    const updateWCIF = (personName, eventId, value) => {

        const intValue = parseInt(value);
        // validar que el valor sea menor o igual a la cantidad de grupos por evento

        if (intValue > groupsByEvent[eventId]) {
            return;
        }

        const updatedPersons = wcif.persons.map(person => {
            if (person.name === personName) {
                return {
                    ...person,
                    [eventId]: intValue
                };
            }
            return person;
        });
        wcif.persons = updatedPersons;
    }

    const getEventGroup = (person, event) => {
        const key = `${person.name}-${event.id}`;
        return editedGroups[key] !== undefined ? editedGroups[key] : (person[event.id] || '');
    }

    const sortBy = (key) => {
        console.log(key)
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    }

    const worldRankingOfPersonInEvent = (person, eventId) => {
        const personalBests = person.personalBests || [];
        if (!personalBests || !personalBests.some(pb => pb.eventId === eventId)) {
            return 10 ** 9;
        }
        return Math.min(
            ...personalBests
                .filter(pb => pb.eventId === eventId)
                .map(pb => pb.worldRanking || 10 ** 9)
        );
    }



    const sortedPersons = [...wcif.persons].filter(person =>
        person.name.toLowerCase().includes(filterName.toLowerCase())
    ).sort((a, b) => {
        if (sortConfig.key === 'name') {
            return sortConfig.direction === 'ascending' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortConfig.key === 'age') {
            return sortConfig.direction === 'ascending' ? a.age - b.age : b.age - a.age;
        }
        // Sorting by world ranking in the specified event
        if (events.find(event => event.id === sortConfig.key)) {
            const eventId = sortConfig.key;
            const worldRankingA = worldRankingOfPersonInEvent(a, eventId);
            const worldRankingB = worldRankingOfPersonInEvent(b, eventId);
            return sortConfig.direction === 'ascending' ? worldRankingA - worldRankingB : worldRankingB - worldRankingA;
        }
        // Default sorting by name if no valid key is provided
        return a.name.localeCompare(b.name);
    });

    const competitorsPerEvent = events.reduce((acc, event) => {
        acc[event.id] = wcif.persons.filter(person => person[event.id] !== undefined).length;
        return acc;
    }, {});

    const generateScoreSheet = async () => {

        setUrlEmptyScoreSheet('');
        setUrlScoreSheet('');

        wcif.lang = languageScoreSheet;


        wcif.groups = groupsByEvent;
        wcif.addWcaId = showWcaId;

        wcif.groups = Object.keys(wcif.groups).reduce((acc, key) => {
            if (key !== 'criteria') {
                acc[key] = wcif.groups[key];
            }
            return acc;
        }, {});

        // llamamos a papi
        const response = await mutateGenerateScoreSheet.mutateAsync(wcif);
        setUrlEmptyScoreSheet(response.emptyScoreSheet);
        setUrlScoreSheet(response.scoreSheet);

    }

    const downloadImages = async () => {

        setUrlZip('');

        const avatars = wcif.persons.filter(person => person.avatar && !person.avatar.url.includes('missing_avatar_thumb')).map(person => {
            return {
                "name": person.name,
                "url": person.avatar.url,
                "registrantId": person.registrantId
            }
        })
        avatars.push({
            "name": wcif.id,
        })

        const response = await mutateAvatarZip.mutateAsync({ "avatars": avatars });

        setUrlZip(response.url)

    }


    return (
        <div className='overflow-x-auto mt-5'>
            <div className="flex flex-row gap-10 w-full">
                <div className='w-1/2'>
                    <label className="mr-2">{t("filter-by-name")}</label>
                    <input
                        type="text"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        className="px-2 py-1 border rounded"
                    />
                </div>
                <div className="w-1/2">
                    {/* Boton para descargar las imagenes  */}
                    <button className="py-2 px-4 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600" onClick={() => downloadImages()}>{t("obtain-images-competitors")}</button>

                    {urlZip && <a href={urlZip} download="avatars.zip" className="py-2 px-4 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 ml-2">{t("download-zip")}</a>
                    }
                </div>
            </div>
            <table className='min-w-full table-auto mt-4'>
                <thead>
                    <tr className='bg-gray-200 text-gray-600 uppercase text-sm leading-normal'>
                        <th className='py-3 px-6 text-left' onClick={() => sortBy('wcaId')}>WCA ID</th>
                        <th className='py-3 px-6 text-left' onClick={() => sortBy('name')}>{t("name")}</th>
                        <th className='py-3 px-6 text-left' onClick={() => sortBy('age')}>{t("age")}</th>
                        {events.map(event => (
                            <th key={event.id} className='py-3 px-6 text-left' onClick={() => sortBy(event.id)}>{event.id}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className='text-gray-600 text-sm font-light'>
                    {sortedPersons.map((person, index) => (
                        <tr key={index} className='border-b border-gray-200 hover:bg-gray-100'>
                            <td className='py-3 px-6 text-left whitespace-nowrap'>
                                <a href={`https://www.worldcubeassociation.org/persons/${person.wcaId}`} className='text-red-400 hover:text-xl' target='_blank'>{person.wcaId}</a>
                            </td>
                            <td className='py-3 px-6 text-left whitespace-nowrap'>{person.name}</td>
                            <td className='py-3 px-6 text-left whitespace-nowrap'>{person.age}</td>
                            {events.map(event => (
                                <td key={`${person.registrantId}-${event.id}`} className='py-3 px-6 text-left'>
                                    <input
                                        type="number"
                                        className={`w-16 p-2 rounded border ${getEventGroup(person, event) === '' ? 'border-dotted border-red-300' : 'border'} ${groupsByEvent[event.id] < getEventGroup(person, event) ? 'border-red-500' : ''}`}
                                        value={getEventGroup(person, event)}
                                        onChange={(e) => handleInputChange(person.name, event.id, e.target.value)}
                                        min={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'e' || e.key === ',' || e.key === 'E' || e.key === '.' || e.key === '-' || e.key === '+') {
                                                e.preventDefault();
                                            }
                                        }
                                        }

                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className='flex flex-row mb-5'>
                <div className="mt-4 w-1/3">
                    <input type="checkbox" checked={showWcaId} onChange={() => setShowWcaId(!showWcaId)} className="mr-2" />
                    <label>{t("show-wca-id")}</label>
                </div>
                <div className="mt-4 w-1/3">
                    <label>{t("select-language")}</label>
                    <select
                        className="px-2 py-1 border rounded"
                        value={languageScoreSheet}
                        onChange={(e) => setLanguageScoreSheet(e.target.value)}
                    >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                    </select>
                </div>
                <div className="mt-4 w-1/3">
                    <button onClick={generateScoreSheet} className="py-2 px-4 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600">{t("generate-score-sheet")}</button>
                </div>
            </div>
            <div className="mb-4">
                {urlScoreSheet && (
                    <a
                        href={urlScoreSheet}
                        download="scoresheet.pdf"
                        className="block py-2 px-4 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600"
                    >
                        {t("download-scoresheet")}
                    </a>
                )}
            </div>
            <div>
                {urlEmptyScoreSheet && (
                    <a
                        href={urlEmptyScoreSheet}
                        download="empty-scoresheet.pdf"
                        className="block py-2 px-4 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600"
                    >
                        {t("download-empty-scoresheet")}
                    </a>
                )}
            </div>

        </div>
    );
}

export default PersonTable;
