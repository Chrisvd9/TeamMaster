import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader/Loader";
import { useCompetitions } from "../queries/competitions";
import { useTranslation } from "react-i18next";

const Competitions = () => {
  const { data, isLoading } = useCompetitions();
  const { t } = useTranslation("global");

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto px-4 animate-fade-in animate-delay-200 animate-duration-slow">
      <h1 className="text-2xl font-bold mb-4">{t("competitions")}</h1>

      <div className="overflow-x-auto text-center rounded-lg border border-gray-200">
        <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
          <thead className="text-center">
            <tr>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                {t("name-tournament")}
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                {t("date-tournament")}
              </th>
              <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                {t("delegate")}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {data?.length > 0 ? (
              data?.map(({ id, name, start_date, delegates } = competition) => (
                <tr key={id}>
                  <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                    <Link
                      state={{ competition_id: id }}
                      to={`/competitions/${id}`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      {name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                    {start_date}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                    {delegates[0]?.name}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {t("no-competitions")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Competitions;
